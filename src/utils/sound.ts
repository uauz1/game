let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType, volume: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sounds = {
  click: () => playTone(800, 0.05, 'sine', 0.15),
  correct: () => {
    playTone(523, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 80);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 160);
  },
  wrong: () => {
    playTone(200, 0.15, 'sawtooth', 0.15);
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.15), 100);
  },
  tick: () => playTone(1200, 0.03, 'square', 0.08),
  powerUp: () => {
    playTone(440, 0.08, 'triangle', 0.15);
    setTimeout(() => playTone(660, 0.08, 'triangle', 0.15), 60);
    setTimeout(() => playTone(880, 0.12, 'triangle', 0.15), 120);
  },
  win: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'sine', 0.2), i * 120));
  },
  whoosh: () => playTone(300, 0.1, 'sine', 0.1),
  select: () => playTone(600, 0.06, 'sine', 0.12),
};

export type SoundName = keyof typeof sounds;
