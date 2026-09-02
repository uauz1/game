import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Settings } from '@/types';
import { loadFromStorage, saveToStorage } from '@/utils/storage';
import { sounds, type SoundName } from '@/utils/sound';

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  musicEnabled: false,
  theme: 'dark',
  defaultTimer: 30,
  language: 'ar',
};

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  toggleSound: () => void;
  toggleTheme: () => void;
  playSound: (name: SoundName) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    loadFromStorage('settings', DEFAULT_SETTINGS)
  );

  useEffect(() => {
    saveToStorage('settings', settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [settings.theme]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleSound = useCallback(() => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const playSound = useCallback(
    (name: SoundName) => {
      if (settings.soundEnabled) {
        try {
          sounds[name]();
        } catch {
          // audio not ready
        }
      }
    },
    [settings.soundEnabled]
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleSound, toggleTheme, playSound }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
