import { useEffect, useState } from 'react';

const SETTINGS_KEY = 'qaddha.new-games.settings.v1';
const SITE_PREFS_KEY = 'qaddha_site_prefs_v1';

type SettingsMap = Record<string, Record<string, number>>;

function globalFallback(field: string, fallback: number) {
  if (field !== 'seconds') return fallback;
  try {
    const prefs = JSON.parse(localStorage.getItem(SITE_PREFS_KEY) ?? '{}') as { defaultDuration?: unknown };
    const duration = Number(prefs.defaultDuration);
    if (duration === 30 || duration === 45 || duration === 60) return duration;
    if (duration === 90) return 60;
  } catch {
    // Keep the game's own fallback if site preferences are unavailable.
  }
  return fallback;
}

export function useNewGameNumber(game: string, field: string, fallback: number) {
  const [value, setValue] = useState(() => {
    const resolvedFallback = globalFallback(field, fallback);
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as SettingsMap;
      const stored = Number(settings[game]?.[field]);
      const allowed = field === 'seconds' ? [20, 30, 45, 60] : [4, 6, 8];
      return allowed.includes(stored) ? stored : resolvedFallback;
    } catch {
      return resolvedFallback;
    }
  });

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as SettingsMap;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, [game]: { ...settings[game], [field]: value } }));
    } catch {
      // Settings remain active for the current visit.
    }
  }, [field, game, value]);

  return [value, setValue] as const;
}
