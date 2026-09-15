import type { HuroofDifficulty } from '../data/huroofQuestions';
import { loadSharedTeams, saveSharedTeams } from './sharedTeams';

const STORAGE_KEY = 'qaddha.huroof.preferences.v1';
const USED_QUESTIONS_KEY = 'qaddha.huroof.used-questions.v1';
const SITE_PREFS_KEY = 'qaddha_site_prefs_v1';
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

function readSiteDefaults() {
  try {
    const prefs = JSON.parse(localStorage.getItem(SITE_PREFS_KEY) ?? '{}') as { defaultDuration?: unknown; questionIntensity?: unknown };
    const duration = Number(prefs.defaultDuration);
    const seconds = duration === 45 || duration === 60 ? duration : 30;
    const difficulty: HuroofDifficulty = prefs.questionIntensity === 'hardcore' ? 'hard' : 'medium';
    return { seconds, difficulty };
  } catch {
    return { seconds: defaultHuroofPreferences.seconds, difficulty: defaultHuroofPreferences.difficulty };
  }
}

export function loadHuroofPreferences(): HuroofPreferences {
  const sharedTeams = loadSharedTeams();
  const siteDefaults = readSiteDefaults();
  const fallback: HuroofPreferences = {
    ...defaultHuroofPreferences,
    seconds: siteDefaults.seconds,
    difficulty: siteDefaults.difficulty,
    teamNames: sharedTeams ? [sharedTeams[0].name, sharedTeams[1].name] : defaultHuroofPreferences.teamNames,
    teamColors: sharedTeams ? [sharedTeams[0].color, sharedTeams[1].color] : defaultHuroofPreferences.teamColors,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const value = JSON.parse(raw) as Partial<HuroofPreferences>;
    const names = Array.isArray(value.teamNames) && value.teamNames.length === 2 && value.teamNames.every(name => typeof name === 'string' && name.trim())
      ? value.teamNames as [string, string]
      : fallback.teamNames;
    const colors = Array.isArray(value.teamColors) && value.teamColors.length === 2 && value.teamColors.every(color => typeof color === 'string') && value.teamColors[0] !== value.teamColors[1]
      ? value.teamColors as [string, string]
      : fallback.teamColors;
    return {
      teamNames: sharedTeams ? [sharedTeams[0].name, sharedTeams[1].name] : names,
      teamColors: sharedTeams ? [sharedTeams[0].color, sharedTeams[1].color] : colors,
      seconds: ALLOWED_SECONDS.has(Number(value.seconds)) ? Number(value.seconds) : fallback.seconds,
      difficulty: ALLOWED_DIFFICULTIES.has(value.difficulty as HuroofDifficulty) ? value.difficulty as HuroofDifficulty : fallback.difficulty,
      bestOf: ALLOWED_ROUNDS.has(Number(value.bestOf)) ? Number(value.bestOf) : fallback.bestOf,
    };
  } catch {
    return fallback;
  }
}

export function saveHuroofPreferences(preferences: HuroofPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    saveSharedTeams(preferences.teamNames.map((name, index) => ({ name, color: preferences.teamColors[index] })));
  } catch {
    // The game remains fully usable when storage is unavailable.
  }
}

export function loadUsedHuroofQuestions() {
  try {
    const value = JSON.parse(localStorage.getItem(USED_QUESTIONS_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveUsedHuroofQuestions(ids: string[]) {
  try {
    localStorage.setItem(USED_QUESTIONS_KEY, JSON.stringify(ids.slice(-1200)));
  } catch {
    // Question rotation still works during the current match.
  }
}
