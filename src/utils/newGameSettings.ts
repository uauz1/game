import { useEffect, useState } from 'react';

const SETTINGS_KEY = 'qaddha.new-games.settings.v1';

type SettingsMap = Record<string, Record<string, number>>;

export function useNewGameNumber(game: string, field: string, fallback: number) {
  const [value, setValue] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as SettingsMap;
      const stored = Number(settings[game]?.[field]);
      const allowed = field === 'seconds' ? [20, 30, 45, 60] : [4, 6, 8];
      return allowed.includes(stored) ? stored : fallback;
    } catch {
      return fallback;
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
