import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Crown, Download, Sparkles } from 'lucide-react';
import App from '../../App';
const PartyHub = lazy(() => import('./PartyHub'));
const MultiplayerHostLayer = lazy(() => import('./MultiplayerHostLayer'));
import { readProgression, recordGameStarted, recordTournamentFinished } from '../../utils/progression';

const HUB_GAMES = [
  {id:'teams',title:'قدّها فرق',tag:'فريقان + مقدم'},
  {id:'letters',title:'حروف مع عزيز',tag:'حروف + سرعة بديهة'},
  {id:'who',title:'من أنا؟',tag:'تخمين + خطف'},
  {id:'photo',title:'تحدي الصور',tag:'صور حقيقية + ربط'},
  {id:'words',title:'بنك الكلمات',tag:'كلمات + وصف'},
  {id:'fast',title:'مين أسرع؟',tag:'سرعة + زر'},
  {id:'character',title:'خمن الشخصية',tag:'شخصيات'},
  {id:'riddles',title:'فوازير',tag:'ألغاز'},
  {id:'family',title:'تحدي العائلة',tag:'إجابات جمهور'},
  {id:'connection',title:'وش الرابط؟',tag:'ربط + سرعة بديهة'},
  {id:'auction',title:'المزاد',tag:'فرق + مخاطرة'},
  {id:'order',title:'رتّبها',tag:'ترتيب + معرفة'},
  {id:'memory',title:'ذاكرة البرق',tag:'ذاكرة + تركيز'},
  {id:'missing',title:'وش الناقص؟',tag:'ملاحظة + ذاكرة'},
  {id:'acting',title:'مثّلها',tag:'تمثيل + فرق'},
  {id:'secret',title:'الكلمة السرّية',tag:'خداع + نقاش'},
  {id:'pressure',title:'تحت الضغط',tag:'سرعة + معرفة'},
  {id:'intruder',title:'الدخيل',tag:'ذكاء + ملاحظة'},
];

const SEEN_GAME_KEY = 'qaddha.progress-seen-game.v1';
const SEEN_TOURNAMENT_KEY = 'qaddha.progress-seen-tournament.v1';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function syncProgression() {
  try {
    const player = JSON.parse(localStorage.getItem('qaddha.player.v1') || '{}');
    const latest = Array.isArray(player.recent) ? player.recent[0] : null;
    if (latest && typeof latest.gameId === 'string' && typeof latest.playedAt === 'number') {
      const signature = `${latest.gameId}:${latest.playedAt}`;
      if (localStorage.getItem(SEEN_GAME_KEY) !== signature) {
        recordGameStarted(latest.gameId);
        localStorage.setItem(SEEN_GAME_KEY, signature);
      }
    }
    const history = JSON.parse(localStorage.getItem('qaddha.tournament-history.v1') || '[]');
    const latestTournament = Array.isArray(history) ? history[0] : null;
    if (latestTournament && typeof latestTournament.signature === 'string' && latestTournament.signature) {
      if (localStorage.getItem(SEEN_TOURNAMENT_KEY) !== latestTournament.signature) {
        recordTournamentFinished();
        localStorage.setItem(SEEN_TOURNAMENT_KEY, latestTournament.signature);
      }
    }
  } catch {
    // Progress tracking must never block gameplay.
  }
}

const multiplayerLayer = <Suspense fallback={null}><MultiplayerHostLayer/></Suspense>;

export default function PlatformShell() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const onlineEmbed = params.get('onlineEmbed') === '1';
  const [hubOpen, setHubOpen] = useState(!onlineEmbed && params.get('hub') === '1');
  const [updateReady, setUpdateReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [level, setLevel] = useState(() => Math.max(1, Math.floor(Math.sqrt(readProgression().xp / 75)) + 1));

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      if (window.matchMedia('(display-mode: standalone)').matches) return;
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    const onUpdate = () => setUpdateReady(true);
    window.addEventListener('qaddha:update-ready', onUpdate);
    return () => window.removeEventListener('qaddha:update-ready', onUpdate);
  }, []);

  useEffect(() => {
    const syncNow = () => {
      syncProgression();
      setLevel(Math.max(1, Math.floor(Math.sqrt(readProgression().xp / 75)) + 1));
    };
    syncNow();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') syncNow();
    }, 10000);
    const onVisible = () => { if (document.visibilityState === 'visible') syncNow(); };
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith('qaddha.')) syncNow();
    };
    window.addEventListener('qaddha:progression-changed', syncNow);
    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', syncNow);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('qaddha:progression-changed', syncNow);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', syncNow);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const openHub = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('hub', '1');
    window.history.replaceState({}, '', url);
    setHubOpen(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const closeHub = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('hub');
    window.history.replaceState({}, '', url);
    setHubOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const playFromHub = (gameId: string) => {
    try { localStorage.setItem('qaddha.hub-launch.v1', gameId); } catch {/* optional */}
    closeHub();
    window.setTimeout(()=>window.dispatchEvent(new CustomEvent('qaddha:hub-launch', { detail: { gameId } })),0);
  };

  const applyUpdate = async () => {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      const waiting = registration?.waiting;
      if (!waiting) {
        window.location.reload();
        return;
      }
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
      waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      window.location.reload();
    }
  };
  const installApp = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
    }
  };

  const updateBanner = updateReady ? <div className="qaddha-update-banner" role="status"><span><b>تحديث جديد جاهز</b><small>حدّث لما تخلص جولتك عشان تاخذ آخر التحسينات.</small></span><button onClick={()=>{void applyUpdate();}}>تحديث الآن</button><button className="dismiss" aria-label="إخفاء التنبيه" onClick={()=>setUpdateReady(false)}>×</button></div> : null;
  const installButton = installPrompt ? <button className="qaddha-install-button" onClick={()=>{void installApp();}}><Download/><span><b>ثبّت قدّها</b><small>كتطبيق على جهازك</small></span></button> : null;

  if (onlineEmbed) return <App/>;
  if (hubOpen) return <><Suspense fallback={null}><PartyHub games={HUB_GAMES} onBack={closeHub} onPlay={playFromHub}/></Suspense>{multiplayerLayer}{updateBanner}{installButton}</>;
  return <><App/>{multiplayerLayer}{updateBanner}{installButton}<button className="global-hub-launch" onClick={openHub} aria-label="فتح مركز قدّها"><span><Crown/></span><b>مركز قدّها</b><small>LV {level}</small><Sparkles/></button></>;
}
