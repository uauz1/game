import { sounds, type SoundName } from './sound';

const PREFS_KEY = 'qaddha_site_prefs_v1';

type FeedbackPrefs = {
  soundEnabled: boolean;
  haptics: boolean;
};

function readFeedbackPrefs(): FeedbackPrefs {
  try {
    const preferences = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as { soundEnabled?: boolean; haptics?: boolean };
    return {
      soundEnabled: preferences.soundEnabled !== false,
      haptics: preferences.haptics !== false,
    };
  } catch {
    return { soundEnabled: true, haptics: true };
  }
}

function vibrateFor(name: SoundName) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  const patterns: Partial<Record<SoundName, number | number[]>> = {
    click: 8,
    select: 10,
    correct: 32,
    wrong: [70, 35, 90],
    powerUp: [18, 24, 30],
    win: [28, 35, 28, 35, 75],
  };
  const pattern = patterns[name];
  if (pattern !== undefined) navigator.vibrate(pattern);
}

export function playPartySound(name: SoundName) {
  const preferences = readFeedbackPrefs();
  if (preferences.haptics) vibrateFor(name);
  if (preferences.soundEnabled) sounds[name]();
}
