import type { WhoAmIDifficulty } from '../data/whoAmIQuestions';
import type { WhoAmICard } from '../data/whoAmIQuestions';
import { loadHuroofPreferences } from './huroofStorage';
import { saveSharedTeams } from './sharedTeams';

const STORAGE_KEY = 'qaddha-who-am-i-preferences-v1';
const USED_CARDS_KEY = 'qaddha.who-am-i.used-cards.v1';

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
    saveSharedTeams(preferences.teamNames.map((name, index) => ({ name, color: preferences.teamColors[index] })));
  } catch {
    // The game remains fully playable when storage is blocked or unavailable.
  }
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function drawWhoAmICards(cards: WhoAmICard[], count: number, difficulty: WhoAmIDifficulty) {
  let used: Record<string, string[]> = {};
  try { used = JSON.parse(localStorage.getItem(USED_CARDS_KEY) ?? '{}'); } catch { /* Storage is optional. */ }
  const usedIds = new Set(used[difficulty] ?? []);
  const fresh = shuffle(cards.filter(card => !usedIds.has(card.id)));
  const rollover = fresh.length < count
    ? shuffle(cards.filter(card => !fresh.some(item => item.id === card.id))).slice(0, count - fresh.length)
    : [];
  const picked = [...fresh.slice(0, count), ...rollover];
  used[difficulty] = fresh.length < count
    ? picked.map(card => card.id)
    : [...(used[difficulty] ?? []), ...picked.map(card => card.id)].slice(-cards.length);
  try { localStorage.setItem(USED_CARDS_KEY, JSON.stringify(used)); } catch { /* Storage is optional. */ }
  return picked;
}
