import { useEffect } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';
export type DisplayPreference = 'auto' | 'mobile' | 'tv';
export type SessionModePreference = 'smart' | 'tournament';
export type SessionVibePreference = 'balanced' | 'fast' | 'brain' | 'family';
export type QuestionIntensityPreference = 'balanced' | 'competitive' | 'hardcore';
export type RepeatProtectionPreference = 'standard' | 'strict' | 'maximum';

export type QaddhaSitePrefs = {
  theme: ThemePreference;
  display: DisplayPreference;
  largeText: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
  haptics: boolean;
  compactMode: boolean;
  confirmExit: boolean;
  rememberProgress: boolean;
  defaultPlayers: number;
  defaultDuration: 30 | 45 | 60 | 90;
  defaultVibe: SessionVibePreference;
  defaultSessionMode: SessionModePreference;
  questionIntensity: QuestionIntensityPreference;
  repeatProtection: RepeatProtectionPreference;
};

export const PREFS_KEY = 'qaddha_site_prefs_v1';
export const defaultQaddhaPrefs: QaddhaSitePrefs = {
  theme: 'dark',
  display: 'auto',
  largeText: false,
  reducedMotion: false,
  highContrast: false,
  soundEnabled: true,
  haptics: true,
  compactMode: false,
  confirmExit: true,
  rememberProgress: true,
  defaultPlayers: 8,
  defaultDuration: 45,
  defaultVibe: 'balanced',
  defaultSessionMode: 'smart',
  questionIntensity: 'competitive',
  repeatProtection: 'strict',
};

const isThemePreference = (value: unknown): value is ThemePreference => value === 'dark' || value === 'light' || value === 'system';
const isDisplayPreference = (value: unknown): value is DisplayPreference => value === 'auto' || value === 'mobile' || value === 'tv';
const isSessionMode = (value: unknown): value is SessionModePreference => value === 'smart' || value === 'tournament';
const isVibe = (value: unknown): value is SessionVibePreference => value === 'balanced' || value === 'fast' || value === 'brain' || value === 'family';
const isIntensity = (value: unknown): value is QuestionIntensityPreference => value === 'balanced' || value === 'competitive' || value === 'hardcore';
const isRepeatProtection = (value: unknown): value is RepeatProtectionPreference => value === 'standard' || value === 'strict' || value === 'maximum';

export function readQaddhaPreferences(): QaddhaSitePrefs {
  try {
    const value = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    const duration = [30, 45, 60, 90].includes(value.defaultDuration) ? value.defaultDuration : defaultQaddhaPrefs.defaultDuration;
    const players = typeof value.defaultPlayers === 'number' ? Math.min(24, Math.max(2, Math.round(value.defaultPlayers))) : defaultQaddhaPrefs.defaultPlayers;
    return {
      ...defaultQaddhaPrefs,
      ...value,
      theme: isThemePreference(value.theme) ? value.theme : defaultQaddhaPrefs.theme,
      display: isDisplayPreference(value.display) ? value.display : defaultQaddhaPrefs.display,
      defaultPlayers: players,
      defaultDuration: duration,
      defaultVibe: isVibe(value.defaultVibe) ? value.defaultVibe : defaultQaddhaPrefs.defaultVibe,
      defaultSessionMode: isSessionMode(value.defaultSessionMode) ? value.defaultSessionMode : defaultQaddhaPrefs.defaultSessionMode,
      questionIntensity: isIntensity(value.questionIntensity) ? value.questionIntensity : defaultQaddhaPrefs.questionIntensity,
      repeatProtection: isRepeatProtection(value.repeatProtection) ? value.repeatProtection : defaultQaddhaPrefs.repeatProtection,
    };
  } catch {
    return defaultQaddhaPrefs;
  }
}

export function applyQaddhaPreferences(prefs: QaddhaSitePrefs) {
  const root = document.documentElement;
  const resolvedTheme = prefs.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : prefs.theme;
  root.dataset.themePreference = prefs.theme;
  root.dataset.theme = resolvedTheme;
  root.dataset.qaddhaDisplay = prefs.display;
  root.dataset.tvMode = prefs.display === 'tv' ? 'true' : 'false';
  root.dataset.mobileMode = prefs.display === 'mobile' ? 'true' : 'false';
  root.dataset.qaddhaText = prefs.largeText ? 'large' : 'normal';
  root.dataset.qaddhaMotion = prefs.reducedMotion ? 'reduced' : 'full';
  root.dataset.qaddhaContrast = prefs.highContrast ? 'high' : 'normal';
  root.dataset.qaddhaCompact = prefs.compactMode ? 'compact' : 'comfortable';
  root.dataset.qaddhaSound = prefs.soundEnabled ? 'on' : 'off';
  root.dataset.qaddhaHaptics = prefs.haptics ? 'on' : 'off';
  root.dataset.qaddhaQuestionIntensity = prefs.questionIntensity;
  root.dataset.qaddhaRepeatProtection = prefs.repeatProtection;
  root.style.colorScheme = resolvedTheme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'light' ? '#F4F1E9' : '#0B1020');
}

export function useQaddhaPreferences() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const sync = () => applyQaddhaPreferences(readQaddhaPreferences());
    sync();
    media.addEventListener('change', sync);
    window.addEventListener('qaddha:preferences-changed', sync);
    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('qaddha:preferences-changed', sync);
    };
  }, []);
}
