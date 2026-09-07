import type { HuroofDifficulty } from '../data/huroofQuestions';

const STORAGE_KEY = 'qaddha.huroof.preferences.v1';
const ALLOWED_SECONDS = new Set([20, 30, 45, 60]);
const ALLOWED_ROUNDS = new Set([1, 3, 5]);
const ALLOWED_DIFFICULTIES = new Set<HuroofDifficulty>(['easy', 'medium', 'hard']);

export type HuroofPreferences = {
  teamNames: [string, string];
  teamColors: [string, string];
  seconds: number;
  difficulty: HuroofDifficulty;
  bestOf: number;
};

export const defaultHuroofPreferences: HuroofPreferences = {
  teamNames: ['الفريق الأزرق', 'الفريق الوردي'],
  teamColors: ['#45b6ff', '#ff70b5'],
  seconds: 30,
  difficulty: 'medium',
  bestOf: 3,
};

export function loadHuroofPreferences(): HuroofPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultHuroofPreferences;
    const value = JSON.parse(raw) as Partial<HuroofPreferences>;
    const names = Array.isArray(value.teamNames) && value.teamNames.length === 2 && value.teamNames.every(name => typeof name === 'string' && name.trim())
      ? value.teamNames as [string, string]
      : defaultHuroofPreferences.teamNames;
    const colors = Array.isArray(value.teamColors) && value.teamColors.length === 2 && value.teamColors.every(color => typeof color === 'string') && value.teamColors[0] !== value.teamColors[1]
      ? value.teamColors as [string, string]
      : defaultHuroofPreferences.teamColors;
    return {
      teamNames: names,
      teamColors: colors,
      seconds: ALLOWED_SECONDS.has(Number(value.seconds)) ? Number(value.seconds) : defaultHuroofPreferences.seconds,
      difficulty: ALLOWED_DIFFICULTIES.has(value.difficulty as HuroofDifficulty) ? value.difficulty as HuroofDifficulty : defaultHuroofPreferences.difficulty,
      bestOf: ALLOWED_ROUNDS.has(Number(value.bestOf)) ? Number(value.bestOf) : defaultHuroofPreferences.bestOf,
    };
  } catch {
    return defaultHuroofPreferences;
  }
}

export function saveHuroofPreferences(preferences: HuroofPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // The game remains fully usable when storage is unavailable.
  }
}
