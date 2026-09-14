import { useEffect, useRef } from 'react';
import { Award, BarChart3, Clock3, Gamepad2, Heart, Library, LockKeyhole, LogIn, Sparkles, Trophy, UserRound, X } from 'lucide-react';

export type PlayerActivity = {
  gameId: string;
  playedAt: number;
};

type GameSummary = {
  id: string;
  title: string;
  cover: string;
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

  if (!open) return null;
  const favoriteGames = games.filter((game) => favorites.includes(game.id));
  const recentGames = recent.flatMap((activity) => {
    const game = games.find((item) => item.id === activity.gameId);
    return game ? [{ ...game, playedAt: activity.playedAt }] : [];
  });
  const uniqueRecent = new Set(recentGames.map(game => game.id)).size;
  const explorationProgress = games.length ? Math.round((uniqueRecent / games.length) * 100) : 0;
  const achievements = [
    { id: 'first', title: 'أول تحدّي', desc: 'ابدأ أول لعبة في قدّها', icon: Gamepad2, unlocked: uniqueRecent >= 1 },
    { id: 'explorer', title: 'مستكشف قدّها', desc: 'جرّب 4 ألعاب مختلفة', icon: Sparkles, unlocked: uniqueRecent >= 4 },
    { id: 'collector', title: 'اختياراتي', desc: 'احفظ 3 ألعاب في المفضلة', icon: Heart, unlocked: favoriteGames.length >= 3 },
    { id: 'veteran', title: 'قدّها المخضرم', desc: 'جرّب 8 ألعاب مختلفة', icon: Trophy, unlocked: uniqueRecent >= 8 },
  ];
  const unlockedCount = achievements.filter(item => item.unlocked).length;
  const nextAchievement = achievements.find(item => !item.unlocked);

  return <div className="player-overlay" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <section className="player-panel" role="dialog" aria-modal="true" aria-label="ملف اللاعب">
      <header><div className="player-avatar"><UserRound/></div><div><span>{accountName ? 'حساب متصل' : 'وضع الضيف'}</span><h2>{accountName || 'يا هلا باللاعب'}</h2><p>مفضّلتك وآخر ألعابك وتقدّمك في قدّها في مكان واحد.</p></div><button ref={closeRef} className="settings-close" aria-label="إغلاق ملف اللاعب" onClick={onClose}><X/></button></header>

      <div className="player-stat-grid" aria-label="ملخص مكتبة اللاعب">
        <article><Library/><div><small>مكتبة قدّها</small><b>{games.length}</b><span>لعبة جاهزة</span></div></article>
        <article><Heart/><div><small>المفضلة</small><b>{favoriteGames.length}</b><span>اختيارات محفوظة</span></div></article>
        <article><BarChart3/><div><small>استكشافك</small><b>{uniqueRecent}</b><span>ألعاب مختلفة</span></div></article>
      </div>

      <section className="player-progress-card" aria-label="تقدم استكشاف الألعاب">
        <div><span><Award/> مستوى الاستكشاف</span><b>{explorationProgress}%</b></div>
        <div className="player-progress-track"><i style={{width:`${explorationProgress}%`}}/></div>
        <p>{uniqueRecent >= games.length && games.length ? 'جرّبت كل ألعاب قدّها 👏' : `جرّبت ${uniqueRecent} من ${games.length} ألعاب. باقي ${Math.max(0, games.length - uniqueRecent)}.`}</p>
      </section>

      <section className="player-section player-achievements"><div className="player-section-title"><Award/><h3>الإنجازات</h3><span>{unlockedCount}/{achievements.length}</span></div><div className="achievement-grid">{achievements.map(({id,title,desc,icon:Icon,unlocked})=><article key={id} className={unlocked?'unlocked':'locked'}><span>{unlocked?<Icon/>:<LockKeyhole/>}</span><div><b>{title}</b><small>{unlocked?'مفتوح':desc}</small></div>{unlocked&&<em>✓</em>}</article>)}</div>{nextAchievement&&<p className="next-achievement"><Trophy/> الإنجاز الجاي: <b>{nextAchievement.title}</b> — {nextAchievement.desc}</p>}</section>

      <div className={`guest-account-note ${accountName ? 'signed-in' : ''}`}><LogIn/><div><b>{accountName ? 'أنت مسجل الدخول' : 'الحساب اختياري'}</b><small>{accountName ? 'تقدر تكمل اللعب كالمعتاد وتسجيل الخروج وقت ما تحب.' : accountConfigured ? 'سجّل دخولك أو أنشئ حسابًا، أو كمل اللعب مباشرة كضيف.' : 'تلعب الآن بلا تسجيل. خدمة الحسابات جاهزة وتحتاج تفعيل الربط الآمن فقط.'}</small></div>{accountConfigured && <button onClick={accountName ? onSignOut : onAuth}>{accountName ? 'خروج' : 'دخول'}</button>}</div>
      <section className="player-section"><div className="player-section-title"><Heart/><h3>المفضلة</h3><span>{favoriteGames.length}</span></div>{favoriteGames.length ? <div className="player-game-list">{favoriteGames.map((game) => <article key={game.id}><img src={game.cover} alt=""/><button onClick={() => { onPlay(game.id); onClose(); }}><b>{game.title}</b><small>العب الآن</small></button><button className="favorite-remove" aria-label={`إزالة ${game.title} من المفضلة`} onClick={() => onToggleFavorite(game.id)}><Heart fill="currentColor"/></button></article>)}</div> : <div className="player-empty"><Heart/><b>مفضّلتك فاضية</b><p>اضغط القلب على أي لعبة عشان تلقاها هنا بسرعة.</p></div>}</section>
      <section className="player-section"><div className="player-section-title"><Clock3/><h3>لعبت مؤخرًا</h3><span>{recentGames.length}</span></div>{recentGames.length ? <div className="player-game-list">{recentGames.map((game) => <article key={`${game.id}-${game.playedAt}`}><img src={game.cover} alt=""/><button onClick={() => { onPlay(game.id); onClose(); }}><b>{game.title}</b><small>{formatRecent(game.playedAt)}</small></button><Gamepad2/></article>)}</div> : <div className="player-empty"><Gamepad2/><b>ما بدأت لعبة إلى الآن</b><p>اختر لعبة من المكتبة وبتظهر هنا تلقائيًا.</p></div>}</section>
    </section>
  </div>;
}
