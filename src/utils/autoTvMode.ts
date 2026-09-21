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

function readForcedDisplayFromUrl(): DisplayPreference | null {
  const params = new URLSearchParams(window.location.search);
  const tv = params.get('tv');
  const cast = params.get('cast');
  const display = params.get('display');
  if (tv === '1' || tv === 'true' || cast === '1' || cast === 'true' || display === 'tv') return 'tv';
  if (display === 'mobile') return 'mobile';
  return null;
}

function isLikelyMobileDevice() {
  const ua = navigator.userAgent || '';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrowScreen = Math.min(window.screen.width || 0, window.screen.height || 0) <= 1024;
  return /Android|iPhone|iPad|iPod|Mobile|Huawei/i.test(ua) || (coarse && narrowScreen);
}

function readViewport() {
  const vv = window.visualViewport;
  const width = Math.max(window.innerWidth, document.documentElement.clientWidth || 0, vv?.width || 0);
  const height = Math.max(window.innerHeight, document.documentElement.clientHeight || 0, vv?.height || 0);
  return { width, height };
}

function isTvLayout() {
  const { width, height } = readViewport();
  const screenWidth = Math.max(window.screen.width || 0, window.screen.height || 0);
  const screenHeight = Math.min(window.screen.width || 0, window.screen.height || 0);
  const landscape = width > height || window.matchMedia?.('(orientation: landscape)').matches;
  const mobileLandscape = isLikelyMobileDevice() && landscape && (width >= 640 || screenWidth >= 700);
  const wideScreen = width >= 1180 && height >= 620;
  const shortLandscape = landscape && width >= 700 && height <= 760;
  const desktopLandscape = landscape && width >= 900;
  const mirroredPhoneShape = isLikelyMobileDevice() && landscape && screenWidth >= 700 && screenHeight <= 620;
  return wideScreen || shortLandscape || desktopLandscape || mobileLandscape || mirroredPhoneShape;
}

function applyResolvedDisplay(mode: DisplayPreference) {
  const root = document.documentElement;
  root.dataset.qaddhaDisplay = mode;
  root.dataset.tvMode = mode === 'tv' ? 'true' : 'false';
  root.dataset.mobileMode = mode === 'mobile' ? 'true' : 'false';
}

function resolveDisplayMode() {
  const forced = readForcedDisplayFromUrl();
  const preference = forced ?? readDisplayPreference();
  const root = document.documentElement;
  root.dataset.qaddhaDisplayPreference = forced ? 'url' : preference;
  root.dataset.qaddhaTvDirect = forced === 'tv' ? 'on' : 'off';

  if (preference !== 'auto') {
    applyResolvedDisplay(preference);
    root.dataset.qaddhaAutoTv = forced === 'tv' ? 'direct' : 'off';
    root.dataset.qaddhaCast = forced === 'tv' && isLikelyMobileDevice() ? 'on' : 'off';
    return;
  }

  const tv = isTvLayout();
  const cast = tv && isLikelyMobileDevice();
  applyResolvedDisplay(tv ? 'tv' : 'auto');
  root.dataset.qaddhaAutoTv = tv ? 'on' : 'off';
  root.dataset.qaddhaCast = cast ? 'on' : 'off';
}

let timer = 0;
function scheduleResolve() {
  window.clearTimeout(timer);
  timer = window.setTimeout(resolveDisplayMode, 60);
}

resolveDisplayMode();
window.addEventListener('resize', scheduleResolve, { passive: true });
window.visualViewport?.addEventListener('resize', scheduleResolve, { passive: true });
window.visualViewport?.addEventListener('scroll', scheduleResolve, { passive: true });
window.addEventListener('orientationchange', scheduleResolve, { passive: true });
window.addEventListener('pageshow', scheduleResolve, { passive: true });
window.addEventListener('qaddha:preferences-changed', scheduleResolve);
window.addEventListener('popstate', scheduleResolve);
document.addEventListener('fullscreenchange', scheduleResolve);
window.setTimeout(resolveDisplayMode, 0);
window.setTimeout(resolveDisplayMode, 250);
window.setTimeout(resolveDisplayMode, 800);

export {};
