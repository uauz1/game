const PREFS_KEY = 'qaddha_site_prefs_v1';

type DisplayPreference = 'auto' | 'mobile' | 'tv';

function readDisplayPreference(): DisplayPreference {
  try {
    const value = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')?.display;
    return value === 'mobile' || value === 'tv' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

function isTvLayout() {
  const width = Math.max(window.innerWidth, document.documentElement.clientWidth || 0);
  const height = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
  const landscape = width > height;
  return (width >= 1180 && height >= 620) || (landscape && width >= 700 && height <= 700) || (landscape && width >= 900);
}

function resolveDisplayMode() {
  const preference = readDisplayPreference();
  const root = document.documentElement;
  root.dataset.qaddhaDisplayPreference = preference;
  if (preference !== 'auto') {
    root.dataset.qaddhaDisplay = preference;
    root.dataset.qaddhaAutoTv = 'off';
    return;
  }
  const tv = isTvLayout();
  root.dataset.qaddhaDisplay = tv ? 'tv' : 'auto';
  root.dataset.qaddhaAutoTv = tv ? 'on' : 'off';
}

let timer = 0;
function scheduleResolve() {
  window.clearTimeout(timer);
  timer = window.setTimeout(resolveDisplayMode, 80);
}

resolveDisplayMode();
window.addEventListener('resize', scheduleResolve, { passive: true });
window.addEventListener('orientationchange', scheduleResolve, { passive: true });
window.addEventListener('qaddha:preferences-changed', scheduleResolve);
document.addEventListener('fullscreenchange', scheduleResolve);
window.setTimeout(resolveDisplayMode, 0);
window.setTimeout(resolveDisplayMode, 250);

export {};
