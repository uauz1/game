import { useEffect, useMemo, useRef, useState } from 'react';
import { Award, BarChart3, CalendarDays, Clock3, Compass, Crown, Flame, Gamepad2, Heart, History, Library, LockKeyhole, LogIn, Play, Sparkles, Target, Trophy, UserRound, X } from 'lucide-react';
import { readTournamentHistory, type TournamentHistoryEntry } from '../../utils/tournamentHistory';

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

type DailyState = {
  lastPlayedDay: string;
  streak: number;
  totalDaily: number;
};

const DAILY_KEY = 'qaddha.daily-challenge.v1';

function formatRecent(timestamp: number) {
  const elapsed = Date.now() - timestamp;
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} س`;
  return new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short' }).format(timestamp);
}

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayDistance(from: string, to: string) {
  const parse = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

function readDailyState(): DailyState {
  try {
    const raw = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}');
    return {
      lastPlayedDay: typeof raw.lastPlayedDay === 'string' ? raw.lastPlayedDay : '',
      streak: typeof raw.streak === 'number' ? Math.max(0, raw.streak) : 0,
      totalDaily: typeof raw.totalDaily === 'number' ? Math.max(0, raw.totalDaily) : 0,
    };
  } catch {
    return { lastPlayedDay: '', streak: 0, totalDaily: 0 };
  }
}

function stableDailyIndex(day: string, length: number) {
  if (!length) return 0;
  let hash = 0;
  for (const char of day) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % length;
}

function playerTitle(level: number) {
  if (level >= 8) return 'أسطورة الجلسة';
  if (level >= 6) return 'قائد التحدّي';
  if (level >= 4) return 'منافس مخضرم';
  if (level >= 2) return 'لاعب قدّها';
  return 'داخل التحدّي';
}

function formatTournamentDate(timestamp: number) {
  return new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(timestamp);
}

export default function PlayerPanel({ open, onClose, games, favorites, recent, onPlay, onToggleFavorite, accountConfigured, accountName, onAuth, onSignOut }: PlayerPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [dailyState, setDailyState] = useState<DailyState>(() => readDailyState());
  const [tournamentHistory, setTournamentHistory] = useState<TournamentHistoryEntry[]>(() => readTournamentHistory());

  useEffect(() => {
    if (!open) return;
    setDailyState(readDailyState());
    setTournamentHistory(readTournamentHistory());
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    const refreshHistory = () => setTournamentHistory(readTournamentHistory());
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('qaddha:tournament-history-changed', refreshHistory);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('qaddha:tournament-history-changed', refreshHistory);
    };
  }, [onClose, open]);

  const favoriteGames = useMemo(() => games.filter((game) => favorites.includes(game.id)), [favorites, games]);
  const recentGames = useMemo(() => recent.flatMap((activity) => {
    const game = games.find((item) => item.id === activity.gameId);
    return game ? [{ ...game, playedAt: activity.playedAt }] : [];
  }), [games, recent]);
  const seenIds = useMemo(() => new Set(recentGames.map(game => game.id)), [recentGames]);
  const uniqueRecent = seenIds.size;
  const explorationProgress = games.length ? Math.round((uniqueRecent / games.length) * 100) : 0;
  const today = localDayKey();
  const dailyGame = games[stableDailyIndex(today, games.length)];
  const dailyDone = dailyState.lastPlayedDay === today;
  const recommendation = games.find(game => !seenIds.has(game.id) && !favorites.includes(game.id))
    || games.find(game => !seenIds.has(game.id))
    || favoriteGames[0]
    || games[0];

  const tournamentCount = tournamentHistory.length;
  const decisiveTournaments = tournamentHistory.filter(item => item.winner !== 'تعادل').length;
  const xp = uniqueRecent * 120 + favoriteGames.length * 40 + dailyState.totalDaily * 80 + Math.min(dailyState.streak, 7) * 35 + tournamentCount * 100;
  const level = Math.max(1, Math.floor(xp / 300) + 1);
  const levelFloor = (level - 1) * 300;
  const levelProgress = Math.min(100, Math.round(((xp - levelFloor) / 300) * 100));
  const weekAgo = Date.now() - 7 * 86_400_000;
  const activeThisWeek = new Set(recentGames.filter(game => game.playedAt >= weekAgo).map(game => game.id)).size;
  const weeklyGoal = 4;
  const weeklyProgress = Math.min(weeklyGoal, activeThisWeek);

  const achievements = [
    { id: 'first', title: 'أول تحدّي', desc: 'ابدأ أول لعبة في قدّها', icon: Gamepad2, unlocked: uniqueRecent >= 1 },
    { id: 'explorer', title: 'مستكشف قدّها', desc: 'جرّب 4 ألعاب مختلفة', icon: Sparkles, unlocked: uniqueRecent >= 4 },
    { id: 'collector', title: 'اختياراتي', desc: 'احفظ 3 ألعاب في المفضلة', icon: Heart, unlocked: favoriteGames.length >= 3 },
    { id: 'daily', title: 'موعدنا اليومي', desc: 'ابدأ 3 تحديات يومية', icon: CalendarDays, unlocked: dailyState.totalDaily >= 3 },
    { id: 'streak', title: 'ما تنقطع', desc: 'حافظ على سلسلة 3 أيام', icon: Flame, unlocked: dailyState.streak >= 3 },
    { id: 'tournament', title: 'ليلة بطولة', desc: 'أكمل أول بطولة كاملة', icon: Trophy, unlocked: tournamentCount >= 1 },
    { id: 'level4', title: 'رفعنا المستوى', desc: 'وصل للمستوى 4', icon: Crown, unlocked: level >= 4 },
    { id: 'weekly', title: 'أسبوع حافل', desc: 'نشّط 4 ألعاب مختلفة خلال أسبوع', icon: Target, unlocked: activeThisWeek >= weeklyGoal },
    { id: 'veteran', title: 'قدّها المخضرم', desc: 'جرّب 8 ألعاب مختلفة', icon: Trophy, unlocked: uniqueRecent >= 8 },
  ];
  const unlockedCount = achievements.filter(item => item.unlocked).length;
  const nextAchievement = achievements.find(item => !item.unlocked);

  if (!open) return null;

  const launchDaily = () => {
    if (!dailyGame) return;
    const current = readDailyState();
    let next = current;
    if (current.lastPlayedDay !== today) {
      const gap = current.lastPlayedDay ? dayDistance(current.lastPlayedDay, today) : 0;
      next = {
        lastPlayedDay: today,
        streak: gap === 1 ? current.streak + 1 : 1,
        totalDaily: current.totalDaily + 1,
      };
      try { localStorage.setItem(DAILY_KEY, JSON.stringify(next)); } catch { /* Daily progress can remain visit-only. */ }
      setDailyState(next);
    }
    onPlay(dailyGame.id);
    onClose();
  };

  const launchRecommendation = () => {
    if (!recommendation) return;
    onPlay(recommendation.id);
    onClose();
  };

  return <div className="player-overlay" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <section className="player-panel" role="dialog" aria-modal="true" aria-label="ملف اللاعب">
      <header><div className="player-avatar"><UserRound/></div><div><span>{accountName ? 'حساب متصل' : 'وضع الضيف'}</span><h2>{accountName || 'يا هلا باللاعب'}</h2><p>مفضّلتك وآخر ألعابك وتقدّمك وبطولاتك في قدّها في مكان واحد.</p></div><button ref={closeRef} className="settings-close" aria-label="إغلاق ملف اللاعب" onClick={onClose}><X/></button></header>

      <section className="player-level-card" aria-label={`المستوى ${level}`}>
        <div className="player-level-badge"><Crown/><strong>{level}</strong></div>
        <div className="player-level-copy"><span>{playerTitle(level)}</span><h3>مستوى {level}</h3><div className="player-level-track"><i style={{ width: `${levelProgress}%` }}/></div><small>{xp} XP · باقي {Math.max(0, 300 - (xp - levelFloor))} XP للمستوى الجاي</small></div>
      </section>

      <div className="player-stat-grid" aria-label="ملخص مكتبة اللاعب">
        <article><Library/><div><small>مكتبة قدّها</small><b>{games.length}</b><span>لعبة جاهزة</span></div></article>
        <article><Heart/><div><small>المفضلة</small><b>{favoriteGames.length}</b><span>اختيارات محفوظة</span></div></article>
        <article><BarChart3/><div><small>استكشافك</small><b>{uniqueRecent}</b><span>ألعاب مختلفة</span></div></article>
        <article><Trophy/><div><small>بطولات مكتملة</small><b>{tournamentCount}</b><span>{decisiveTournaments} بنتيجة حاسمة</span></div></article>
      </div>

      <section className={`weekly-mission ${weeklyProgress >= weeklyGoal ? 'complete' : ''}`}>
        <div><Target/><span><small>مهمة الأسبوع</small><b>نشّط 4 ألعاب مختلفة هذا الأسبوع</b></span><strong>{weeklyProgress}/{weeklyGoal}</strong></div>
        <div className="weekly-mission-track"><i style={{ width: `${Math.round((weeklyProgress / weeklyGoal) * 100)}%` }}/></div>
        <p>{weeklyProgress >= weeklyGoal ? 'ممتاز، أنهيت مهمة الأسبوع.' : `باقي ${weeklyGoal - weeklyProgress} ${weeklyGoal - weeklyProgress === 1 ? 'لعبة' : 'ألعاب'} لإكمال المهمة.`}</p>
      </section>

      <div className="player-engagement-grid">
        <section className={`daily-challenge-card ${dailyDone ? 'done' : ''}`}>
          <div className="engagement-card-icon"><CalendarDays/></div>
          <div className="engagement-card-copy"><span>تحدي اليوم</span><h3>{dailyGame?.title || 'قدّها'}</h3><p>{dailyDone ? 'دخلت تحدي اليوم. ارجع بكرة لاختيار جديد.' : 'اختيار واحد يتغيّر كل يوم. ابدأ وحافظ على سلسلتك.'}</p><small><Flame/> سلسلة {dailyState.streak} يوم · {dailyState.totalDaily} تحديات يومية</small></div>
          <button onClick={launchDaily}>{dailyDone ? 'العبه مرة ثانية' : 'ابدأ تحدي اليوم'} <Play/></button>
        </section>

        <section className="smart-recommend-card">
          <div className="engagement-card-icon"><Compass/></div>
          <div className="engagement-card-copy"><span>اقتراح لك</span><h3>{recommendation?.title || 'جرّب لعبة جديدة'}</h3><p>{recommendation && !seenIds.has(recommendation.id) ? 'ما لعبتها مؤخرًا، مناسبة لتوسّع استكشافك.' : 'اختيار سريع مبني على ألعابك الأخيرة ومفضّلتك.'}</p><small><Sparkles/> قدّها يفضّل لك الألعاب الأقل تكرارًا</small></div>
          <button onClick={launchRecommendation}>جرّبها الآن <Play/></button>
        </section>
      </div>

      <section className="player-progress-card" aria-label="تقدم استكشاف الألعاب">
        <div><span><Award/> مستوى الاستكشاف</span><b>{explorationProgress}%</b></div>
        <div className="player-progress-track"><i style={{width:`${explorationProgress}%`}}/></div>
        <p>{uniqueRecent >= games.length && games.length ? 'جرّبت كل ألعاب قدّها 👏' : `جرّبت ${uniqueRecent} من ${games.length} ألعاب. باقي ${Math.max(0, games.length - uniqueRecent)}.`}</p>
      </section>

      <section className="player-section player-achievements"><div className="player-section-title"><Award/><h3>الإنجازات</h3><span>{unlockedCount}/{achievements.length}</span></div><div className="achievement-grid">{achievements.map(({id,title,desc,icon:Icon,unlocked})=><article key={id} className={unlocked?'unlocked':'locked'}><span>{unlocked?<Icon/>:<LockKeyhole/>}</span><div><b>{title}</b><small>{unlocked?'مفتوح':desc}</small></div>{unlocked&&<em>✓</em>}</article>)}</div>{nextAchievement&&<p className="next-achievement"><Trophy/> الإنجاز الجاي: <b>{nextAchievement.title}</b> — {nextAchievement.desc}</p>}</section>

      <section className="player-section tournament-history-section">
        <div className="player-section-title"><History/><h3>سجل البطولات</h3><span>{tournamentHistory.length}</span></div>
        {tournamentHistory.length ? <div className="tournament-history-list">{tournamentHistory.slice(0, 6).map(item => <article key={item.id}><div><small>{formatTournamentDate(item.finishedAt)} · {item.gameCount} ألعاب</small><b>{item.winner === 'تعادل' ? 'تعادل' : `🏆 ${item.winner}`}</b></div><div className="history-score"><span>{item.teamA}<strong>{item.scoreA}</strong></span><i>—</i><span>{item.teamB}<strong>{item.scoreB}</strong></span></div></article>)}</div> : <div className="player-empty"><Trophy/><b>ما عندك بطولة محفوظة إلى الآن</b><p>أكمل بطولة من مدير الجلسة، ونتيجتها تنحفظ هنا تلقائيًا.</p></div>}
      </section>

      <div className={`guest-account-note ${accountName ? 'signed-in' : ''}`}><LogIn/><div><b>{accountName ? 'أنت مسجل الدخول' : 'الحساب اختياري'}</b><small>{accountName ? 'تقدر تكمل اللعب كالمعتاد وتسجيل الخروج وقت ما تحب.' : accountConfigured ? 'سجّل دخولك أو أنشئ حسابًا، أو كمل اللعب مباشرة كضيف.' : 'تلعب الآن بلا تسجيل. خدمة الحسابات جاهزة وتحتاج تفعيل الربط الآمن فقط.'}</small></div>{accountConfigured && <button onClick={accountName ? onSignOut : onAuth}>{accountName ? 'خروج' : 'دخول'}</button>}</div>
      <section className="player-section"><div className="player-section-title"><Heart/><h3>المفضلة</h3><span>{favoriteGames.length}</span></div>{favoriteGames.length ? <div className="player-game-list">{favoriteGames.map((game) => <article key={game.id}><img src={game.cover} alt=""/><button onClick={() => { onPlay(game.id); onClose(); }}><b>{game.title}</b><small>العب الآن</small></button><button className="favorite-remove" aria-label={`إزالة ${game.title} من المفضلة`} onClick={() => onToggleFavorite(game.id)}><Heart fill="currentColor"/></button></article>)}</div> : <div className="player-empty"><Heart/><b>مفضّلتك فاضية</b><p>اضغط القلب على أي لعبة عشان تلقاها هنا بسرعة.</p></div>}</section>
      <section className="player-section"><div className="player-section-title"><Clock3/><h3>لعبت مؤخرًا</h3><span>{recentGames.length}</span></div>{recentGames.length ? <div className="player-game-list">{recentGames.map((game) => <article key={`${game.id}-${game.playedAt}`}><img src={game.cover} alt=""/><button onClick={() => { onPlay(game.id); onClose(); }}><b>{game.title}</b><small>{formatRecent(game.playedAt)}</small></button><Gamepad2/></article>)}</div> : <div className="player-empty"><Gamepad2/><b>ما بدأت لعبة إلى الآن</b><p>اختر لعبة من المكتبة وبتظهر هنا تلقائيًا.</p></div>}</section>
    </section>
  </div>;
}
