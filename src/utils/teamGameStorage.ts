const STORAGE_KEY = 'qaddha.teams.preferences.v1';

export type TeamGamePreferences = {
  teamNames: [string, string];
  teamColors: [string, string];
  categories: string[];
  limit: number;
  seconds: number;
};

export const defaultTeamGamePreferences: TeamGamePreferences = {
  teamNames: ['الصقور', 'الذيبان'],
  teamColors: ['#45b6ff', '#ff70b5'],
  categories: [],
  limit: 12,
  seconds: 30,
};

export function loadTeamGamePreferences(availableCategories: string[]): TeamGamePreferences {
  const fallback = {
    ...defaultTeamGamePreferences,
    categories: availableCategories.slice(0, 6),
  };
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<TeamGamePreferences>;
    const categories = Array.isArray(value.categories)
      ? value.categories.filter((category): category is string => typeof category === 'string' && availableCategories.includes(category)).slice(0, 6)
      : [];
    const names = Array.isArray(value.teamNames) && value.teamNames.length === 2 && value.teamNames.every(name => typeof name === 'string')
      ? value.teamNames as [string, string]
      : fallback.teamNames;
    const colors = Array.isArray(value.teamColors) && value.teamColors.length === 2 && value.teamColors.every(color => typeof color === 'string') && value.teamColors[0] !== value.teamColors[1]
      ? value.teamColors as [string, string]
      : fallback.teamColors;
    return {
      teamNames: names,
      teamColors: colors,
      categories: categories.length >= 3 ? categories : fallback.categories,
      limit: [6, 12, 18, 24, 30].includes(Number(value.limit)) ? Number(value.limit) : fallback.limit,
      seconds: [20, 30, 45, 60].includes(Number(value.seconds)) ? Number(value.seconds) : fallback.seconds,
    };
  } catch {
    return fallback;
  }
}

export function saveTeamGamePreferences(preferences: TeamGamePreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // The game stays playable when browser storage is unavailable.
  }
}
