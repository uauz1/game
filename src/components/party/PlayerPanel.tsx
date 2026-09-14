import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Clock3, Gamepad2, Heart, LogIn, Plus, Trash2, Trophy, UserRound, Users, X } from 'lucide-react';
import './player-tools.css';

export type PlayerActivity = {
  gameId: string;
  playedAt: number;
};

type GameSummary = {
  id: string;
  title: string;
  cover: string;
};

type SavedTeam = {
  id: string;
  teamA: string;
  teamB: string;
};

type PlayerPanelProps = {
  open: boolean;
  onClose: () => void;
  games: GameSummary[];
  favorites: string[];
  recent: PlayerActivity[];
  onPlay: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  accountConfigured: boolean;
  accountName: string;
  onAuth: () => void;
  onSignOut: () => void;
};

const SAVED_TEAMS_KEY = 'qaddha.saved-teams.v1';

function readSavedTeams(): SavedTeam[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_TEAMS_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is SavedTeam => typeof item?.id === 'string' && typeof item?.teamA === 'string' && typeof item?.teamB === 'string').slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function formatRecent(timestamp: number) {
  const elapsed = Date.now() - timestamp;
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} س`;
  return new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short' }).format(timestamp);
}

export default function PlayerPanel({ open, onClose, games, favorites, recent, onPlay, onToggleFavorite, accountConfigured, accountName, onAuth, onSignOut }: PlayerPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>(readSavedTeams);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  const favoriteGames = games.filter((game) => favorites.includes(game.id));
  const recentGames = recent.flatMap((activity) => {
    const game = games.find((item) => item.id === activity.gameId);
    return game ? [{ ...game, playedAt: activity.playedAt }] : [];
  });

  const uniqueRecent = useMemo(() => new Set(recent.map((item) => item.gameId)).size, [recent]);
  const achievements = [
    { title: 'أول خطوة', detail: 'ابدأ أول لعبة', done: recent.length >= 1 },
    { title: 'مستكشف قدّها', detail: 'جرّب 5 ألعاب مختلفة', done: uniqueRecent >= 5 },
    { title: 'مختاراتك', detail: 'احفظ 3 ألعاب بالمفضلة', done: favorites.length >= 3 },
    { title: 'فريق جاهز', detail: 'احفظ تشكيلة فريقين', done: savedTeams.length >= 1 },
  ];

  const persistTeams = (next: SavedTeam[]) => {
    setSavedTeams(next);
    try { localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(next)); } catch { /* keep session copy */ }
  };

  const addTeamPreset = () => {
    const a = teamA.trim();
    const b = teamB.trim();
    if (!a || !b) return;
    const next = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, teamA: a, teamB: b }, ...savedTeams].slice(0, 8);
    persistTeams(next);
    setTeamA('');
    setTeamB('');
  };

  if (!open) return null;

  return <div className="player-overlay" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <section className="player-panel" role="dialog" aria-modal="true" aria-label="ملف اللاعب">
      <header><div className="player-avatar"><UserRound/></div><div><span>{accountName ? 'حساب متصل' : 'وضع الضيف'}</span><h2>{accountName || 'يا هلا باللاعب'}</h2><p>مفضّلتك وآخر ألعابك محفوظة على هذا الجهاز.</p></div><button ref={closeRef} className="settings-close" aria-label="إغلاق ملف اللاعب" onClick={onClose}><X/></button></header>
      <div className={`guest-account-note ${accountName ? 'signed-in' : ''}`}><LogIn/><div><b>{accountName ? 'أنت مسجل الدخول' : 'الحساب اختياري'}</b><small>{accountName ? 'تقدر تكمل اللعب كالمعتاد وتسجيل الخروج وقت ما تحب.' : accountConfigured ? 'سجّل دخولك أو أنشئ حسابًا، أو كمل اللعب مباشرة كضيف.' : 'تلعب الآن بلا تسجيل. خدمة الحسابات جاهزة وتحتاج تفعيل الربط الآمن فقط.'}</small></div>{accountConfigured && <button onClick={accountName ? onSignOut : onAuth}>{accountName ? 'خروج' : 'دخول'}</button>}</div>

      <div className="player-tools-grid">
        <div className="player-tool-card"><Gamepad2/><b>{recent.length} جلسات حديثة</b><span>آخر نشاطك محفوظ محليًا</span></div>
        <div className="player-tool-card"><Heart/><b>{favorites.length} بالمفضلة</b><span>وصول أسرع لألعابك</span></div>
        <div className="player-tool-card"><BarChart3/><b>{uniqueRecent} ألعاب مختلفة</b><span>استكشف أنواع تحديات أكثر</span></div>
      </div>

      <section className="player-section"><div className="player-section-title"><Heart/><h3>المفضلة</h3><span>{favoriteGames.length}</span></div>{favoriteGames.length ? <div className="player-game-list">{favoriteGames.map((game) => <article key={game.id}><img src={game.cover} alt=""/><button onClick={() => { onPlay(game.id); onClose(); }}><b>{game.title}</b><small>العب الآن</small></button><button className="favorite-remove" aria-label={`إزالة ${game.title} من المفضلة`} onClick={() => onToggleFavorite(game.id)}><Heart fill="currentColor"/></button></article>)}</div> : <div className="player-empty"><Heart/><b>مفضّلتك فاضية</b><p>اضغط القلب على أي لعبة عشان تلقاها هنا بسرعة.</p></div>}</section>
      <section className="player-section"><div className="player-section-title"><Clock3/><h3>لعبت مؤخرًا</h3><span>{recentGames.length}</span></div>{recentGames.length ? <div className="player-game-list">{recentGames.map((game) => <article key={`${game.id}-${game.playedAt}`}><img src={game.cover} alt=""/><button onClick={() => { onPlay(game.id); onClose(); }}><b>{game.title}</b><small>{formatRecent(game.playedAt)}</small></button><Gamepad2/></article>)}</div> : <div className="player-empty"><Gamepad2/><b>ما بدأت لعبة إلى الآن</b><p>اختر لعبة من المكتبة وبتظهر هنا تلقائيًا.</p></div>}</section>

      <section className="player-section"><div className="player-section-title"><Users/><h3>الفرق المحفوظة</h3><span>{savedTeams.length}</span></div><p>احفظ أسماء الفرق اللي تستخدمونها كثير عشان تجهيز الجلسة يصير أسرع.</p><div className="saved-team-form"><input value={teamA} onChange={(event) => setTeamA(event.target.value)} placeholder="اسم الفريق الأول" maxLength={28}/><input value={teamB} onChange={(event) => setTeamB(event.target.value)} placeholder="اسم الفريق الثاني" maxLength={28}/><button onClick={addTeamPreset} disabled={!teamA.trim() || !teamB.trim()}><Plus size={17}/> حفظ</button></div>{savedTeams.length > 0 && <div className="saved-team-list">{savedTeams.map((preset) => <article className="saved-team-item" key={preset.id}><div><span className="saved-team-pill">{preset.teamA}</span><span className="saved-team-pill">{preset.teamB}</span></div><button aria-label="حذف التشكيلة" onClick={() => persistTeams(savedTeams.filter((item) => item.id !== preset.id))}><Trash2 size={17}/></button></article>)}</div>}</section>

      <section className="player-section"><div className="player-section-title"><Trophy/><h3>الإنجازات</h3><span>{achievements.filter((item) => item.done).length}/{achievements.length}</span></div><div className="player-achievements">{achievements.map((achievement) => <article className={`player-achievement ${achievement.done ? 'done' : ''}`} key={achievement.title}><Trophy/><div><b>{achievement.title}</b><small>{achievement.done ? 'مكتمل' : achievement.detail}</small></div></article>)}</div></section>
    </section>
  </div>;
}
