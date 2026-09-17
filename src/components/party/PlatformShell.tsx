import { useEffect, useMemo, useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import App from '../../App';
import PartyHub from './PartyHub';
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

export default function PlatformShell() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [hubOpen, setHubOpen] = useState(params.get('hub') === '1');
  const [level, setLevel] = useState(() => Math.max(1, Math.floor(Math.sqrt(readProgression().xp / 75)) + 1));

  useEffect(() => {
    syncProgression();
    const timer = window.setInterval(syncProgression, 1200);
    const refresh = () => setLevel(Math.max(1, Math.floor(Math.sqrt(readProgression().xp / 75)) + 1));
    window.addEventListener('qaddha:progression-changed', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('qaddha:progression-changed', refresh);
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
    window.dispatchEvent(new CustomEvent('qaddha:hub-launch', { detail: { gameId } }));
    const appCard = document.querySelector(`.game-${CSS.escape(gameId)}`) as HTMLButtonElement | null;
    if (appCard) appCard.click();
    else window.setTimeout(() => (document.querySelector(`.game-${CSS.escape(gameId)}`) as HTMLButtonElement | null)?.click(), 80);
  };

  if (hubOpen) return <PartyHub games={HUB_GAMES} onBack={closeHub} onPlay={playFromHub}/>;
  return <><App/><button className="global-hub-launch" onClick={openHub} aria-label="فتح مركز قدّها"><span><Crown/></span><b>مركز قدّها</b><small>LV {level}</small><Sparkles/></button></>;
}
