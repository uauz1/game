import { sounds, type SoundName } from './sound';
import { readQaddhaPreferences } from './sitePreferences';

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
  const preferences = readQaddhaPreferences();
  if (preferences.haptics) vibrateFor(name);
  if (preferences.soundEnabled) sounds[name]();
}
