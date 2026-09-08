import { sounds, type SoundName } from './sound';

const PREFS_KEY = 'qaddha_site_prefs_v1';

export function playPartySound(name: SoundName) {
  try {
    const preferences = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as { soundEnabled?: boolean };
    if (preferences.soundEnabled === false) return;
  } catch {
    // Sound defaults to on when preferences cannot be read.
  }
  sounds[name]();
}
