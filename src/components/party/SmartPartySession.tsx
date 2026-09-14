import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Brain, Cast, Check, Clock3, Gamepad2, Play, QrCode, RotateCcw, Shuffle, Smartphone, Sparkles, Trophy, Users, WandSparkles } from 'lucide-react';
import { readQaddhaPreferences } from './SiteSettings';
import { beginSessionGame, clearPendingSessionGame, consumeSessionGameResult } from '../../utils/sessionBridge';
import { saveSharedTeams } from '../../utils/sharedTeams';
import { saveTournamentResult } from '../../utils/tournamentHistory';

export type SessionGame = {
  id: string;
  title: string;
  tag: string;
};

type Vibe = 'balanced' | 'fast' | 'brain' | 'family';
type Mode = 'smart' | 'tournament';

type Props = {
  games: SessionGame[];
  onBack: () => void;
  onPlay: (gameId: string) => void;
};

type TournamentState = {
  teamA: string;
  teamB: string;
  scores: Record<string, { a: number; b: number }>;
  completed: string[];
};

const STORAGE_KEY = 'qaddha.smart-session.v3';
const LEGACY_STORAGE_KEY = 'qaddha.smart-session.v2';
const PLAYER_KEY = 'qaddha.player.v1';

const vibeLabels: Record<Vibe, string> = {
  balanced: 'متوازنة',
  fast: 'حماس وسرعة',
  brain: 'ذكاء وتخمين',
  family: 'عائلية وخفيفة',
};

const preferredByVibe: Record<Vibe, string[]> = {
  balanced: ['teams', 'letters', 'family', 'connection', 'photo', 'fast', 'riddles', 'who', 'character', 'words', 'auction', 'order', 'memory', 'missing', 'acting', 'secret'],
  fast: ['fast', 'letters', 'photo', 'memory', 'missing', 'connection', 'teams', 'family', 'order', 'riddles', 'character', 'who', 'words', 'auction', 'acting', 'secret'],
  brain: ['connection', 'riddles', 'who', 'character', 'letters', 'order', 'memory', 'teams', 'family', 'words', 'photo', 'missing', 'auction', 'fast', 'secret', 'acting'],
  family: ['family', 'teams', 'photo', 'riddles', 'connection', 'letters', 'acting', 'secret', 'who', 'character', 'words', 'order', 'memory', 'missing', 'auction', 'fast'],
};

function hashId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return Math.abs(hash);
}

function pulse(pattern: number | number[] = 20) {
  try {
    if (readQaddhaPreferences().haptics && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch { /* Haptics are optional. */ }
}

function readRecentGameIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAYER_KEY) || '{}');
    if (!Array.isArray(raw.recent)) return [] as string[];
    return raw.recent
      .filter((item: unknown): item is { gameId: string } => Boolean(item && typeof item === 'object' && typeof (item as { gameId?: unknown }).gameId === 'string'))
      .map((item: { gameId: string }) => item.gameId)
      .slice(0, 8);
  } catch {
    return [] as string[];
  }
}

function pickPlan(games: SessionGame[], vibe: Vibe, duration: number, players: number, recentIds: string[], variation: number) {
  const gameCount = duration <= 30 ? 3 : duration <= 50 ? 4 : duration <= 75 ? 5 : 6;
  const order = preferredByVibe[vibe];
  const sorted = [...games].sort((a, b) => {
    const score = (game: SessionGame) => {
      const preferredIndex = order.indexOf(game.id);
      const base = (preferredIndex < 0 ? order.length : preferredIndex) * 3;
      const recentIndex = recentIds.indexOf(game.id);
      const recentPenalty = recentIndex < 0 ? 0 : Math.max(10, 38 - recentIndex * 4);
      const shuffleOffset = hashId(`${game.id}-${variation}`) % 18;
      return base + recentPenalty + shuffleOffset;
    };
    return score(a) - score(b);
  });

  const plan = sorted.slice(0, Math.min(gameCount, sorted.length));
  if (players >= 10) {
    const teams = plan.findIndex(game => game.id === 'teams');
    if (teams > 0) [plan[0], plan[teams]] = [plan[teams], plan[0]];
  }
  return plan;
}

function defaultSessionState() {
  const prefs = readQaddhaPreferences();
  return {
    mode: prefs.defaultSessionMode as Mode,
    generated: false,
    players: prefs.defaultPlayers,
    duration: prefs.defaultDuration,
    vibe: prefs.defaultVibe as Vibe,
    variation: 0,
    smartCompleted: [] as string[],
    tournament: { teamA:'الفريق الأول', teamB:'الفريق الثاني', scores:{}, completed:[] } as TournamentState,
  };
}

function readSaved() {
  const defaults = defaultSessionState();
  try {
    const prefs = readQaddhaPreferences();
    if (!prefs.rememberProgress) return defaults;
    const source = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || '{}';
    const raw = JSON.parse(source);
    const hasSavedSession = Boolean(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY));
    if (!hasSavedSession) return defaults;
    return {
      mode: raw.mode === 'tournament' ? 'tournament' as Mode : raw.mode === 'smart' ? 'smart' as Mode : defaults.mode,
      generated: Boolean(raw.generated),
      players: typeof raw.players === 'number' ? Math.min(24, Math.max(2, raw.players)) : defaults.players,
      duration: [30,45,60,90].includes(raw.duration) ? raw.duration : defaults.duration,
      vibe: (['balanced','fast','brain','family'] as Vibe[]).includes(raw.vibe) ? raw.vibe as Vibe : defaults.vibe,
      variation: typeof raw.variation === 'number' ? raw.variation : 0,
      smartCompleted: Array.isArray(raw.smartCompleted) ? raw.smartCompleted.filter((id: unknown): id is string => typeof id === 'string') : [],
      tournament: {
        teamA: typeof raw.tournament?.teamA === 'string' ? raw.tournament.teamA : 'الفريق الأول',
        teamB: typeof raw.tournament?.teamB === 'string' ? raw.tournament.teamB : 'الفريق الثاني',
        scores: raw.tournament?.scores && typeof raw.tournament.scores === 'object' ? raw.tournament.scores : {},
        completed: Array.isArray(raw.tournament?.completed) ? raw.tournament.completed : [],
      } as TournamentState,
    };
  } catch {
    return defaults;
  }
}

export default function SmartPartySession({ games, onBack, onPlay }: Props) {
  const saved = useMemo(readSaved, []);
  const recentIds = useMemo(readRecentGameIds, []);
  const historySavedRef = useRef(false);
  const [players, setPlayers] = useState(saved.players);
  const [duration, setDuration] = useState(saved.duration);
  const [vibe, setVibe] = useState<Vibe>(saved.vibe);
  const [mode, setMode] = useState<Mode>(saved.mode);
  const [generated, setGenerated] = useState(saved.generated);
  const [started, setStarted] = useState<string | null>(null);
  const [variation, setVariation] = useState<number>(saved.variation);
  const [smartCompleted, setSmartCompleted] = useState<string[]>(saved.smartCompleted);
  const [tournament, setTournament] = useState<TournamentState>(saved.tournament);
  const [importNotice, setImportNotice] = useState('');

  const plan = useMemo(() => pickPlan(games, vibe, duration, players, recentIds, variation), [games, vibe, duration, players, recentIds, variation]);
  const completed = mode === 'tournament' ? tournament.completed : smartCompleted;
  const perGame = Math.max(7, Math.floor(duration / Math.max(plan.length, 1)));
  const totalA = plan.reduce((sum, game) => sum + (tournament.scores[game.id]?.a || 0), 0);
  const totalB = plan.reduce((sum, game) => sum + (tournament.scores[game.id]?.b || 0), 0);
  const doneCount = plan.filter(game => completed.includes(game.id)).length;
  const allDone = generated && plan.length > 0 && doneCount === plan.length;
  const nextGame = plan.find(game => !completed.includes(game.id));
  const leader = totalA === totalB ? 'تعادل' : totalA > totalB ? tournament.teamA : tournament.teamB;

  useEffect(() => {
    try {
      const prefs = readQaddhaPreferences();
      if (prefs.rememberProgress) localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, generated, players, duration, vibe, variation, smartCompleted, tournament }));
      else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {/* Session persistence is optional. */}
  }, [mode, generated, players, duration, vibe, variation, smartCompleted, tournament]);

  useEffect(() => {
    const imported = consumeSessionGameResult();
    if (!imported) return;
    setStarted(null);
    if (mode === 'tournament') {
      const normalized = imported.scoreA === imported.scoreB ? { a: 1, b: 1 } : imported.scoreA > imported.scoreB ? { a: 3, b: 0 } : { a: 0, b: 3 };
      setTournament(current => ({
        ...current,
        scores: { ...current.scores, [imported.gameId]: normalized },
        completed: current.completed.includes(imported.gameId) ? current.completed : [...current.completed, imported.gameId],
      }));
      setImportNotice(`استوردنا نتيجة ${games.find(game => game.id === imported.gameId)?.title || 'اللعبة'} تلقائيًا · الفائز يحصل على 3 نقاط بطولة.`);
    } else {
      setSmartCompleted(current => current.includes(imported.gameId) ? current : [...current, imported.gameId]);
      setImportNotice(`تم تسجيل ${games.find(game => game.id === imported.gameId)?.title || 'اللعبة'} كمكتملة تلقائيًا.`);
    }
  }, [games, mode]);

  useEffect(() => {
    if (mode !== 'tournament' || !allDone || historySavedRef.current) return;
    const signature = [tournament.teamA, tournament.teamB, ...plan.map(game => game.id), totalA, totalB].join('|');
    saveTournamentResult({
      teamA: tournament.teamA,
      teamB: tournament.teamB,
      scoreA: totalA,
      scoreB: totalB,
      winner: leader,
      gameCount: plan.length,
      signature,
    });
    historySavedRef.current = true;
  }, [allDone, leader, mode, plan, totalA, totalB, tournament.teamA, tournament.teamB]);

  const build = () => {
    pulse(24);
    clearPendingSessionGame();
    historySavedRef.current = false;
    setImportNotice('');
    setGenerated(true);
    setStarted(null);
    setVariation((value: number) => value + 1);
    if (mode === 'tournament') setTournament(current => ({ ...current, scores: {}, completed: [] }));
    else setSmartCompleted([]);
  };

  const remix = () => {
    pulse([16, 30, 16]);
    clearPendingSessionGame();
    historySavedRef.current = false;
    setImportNotice('');
    setVariation((value: number) => value + 1);
    setStarted(null);
    if (mode === 'tournament') setTournament(current => ({ ...current, scores: {}, completed: [] }));
    else setSmartCompleted([]);
  };

  const score = (gameId: string, side: 'a'|'b', delta: number) => {
    pulse(12);
    setTournament(current => {
      const previous = current.scores[gameId] || { a: 0, b: 0 };
      const next = { ...previous, [side]: Math.max(0, previous[side] + delta) };
      return { ...current, scores: { ...current.scores, [gameId]: next } };
    });
  };

  const toggleComplete = (gameId: string) => {
    pulse(20);
    if (mode === 'tournament') {
      setTournament(current => ({
        ...current,
        completed: current.completed.includes(gameId) ? current.completed.filter(id => id !== gameId) : [...current.completed, gameId],
      }));
      return;
    }
    setSmartCompleted(current => current.includes(gameId) ? current.filter(id => id !== gameId) : [...current, gameId]);
  };

  const resetTournament = () => {
    pulse(18);
    clearPendingSessionGame();
    historySavedRef.current = false;
    setImportNotice('');
    setTournament(current => ({ ...current, scores: {}, completed: [] }));
  };
  const launch = (gameId: string) => {
    pulse(18);
    setImportNotice('');
    setStarted(gameId);
    if (mode === 'tournament') {
      saveSharedTeams([{ name: tournament.teamA, color: '#45b6ff' }, { name: tournament.teamB, color: '#ff70b5' }]);
    }
    beginSessionGame({ gameId, mode, teamA: tournament.teamA, teamB: tournament.teamB });
    onPlay(gameId);
  };
  const leaveSession = () => { clearPendingSessionGame(); onBack(); };

  return <section className="smart-session" dir="rtl">
    <div className="session-topline">
      <button className="quiet session-back" onClick={leaveSession}><ArrowLeft/> الرئيسية</button>
      <span className="session-badge"><Sparkles/> مدير جلسة + بطولة</span>
    </div>

    <div className="session-hero">
      <div>
        <span className="eyebrow"><WandSparkles/> مدير الجلسة الذكي</span>
        <h1>قول لنا جمعتكم.<br/><em>ونرتب اللعب عليكم.</em></h1>
        <p>اختار جلسة سريعة أو بطولة كاملة. قدّها ينوّع الألعاب حسب جوكم، يتجنب آخر ما لعبتموه، ويحفظ التقدم إذا اخترتم ذلك من الإعدادات.</p>
      </div>
      <div className="session-orb" aria-hidden="true"><Brain/><span>AI<br/>GM</span></div>
    </div>

    <div className="session-layout">
      <aside className="session-builder">
        <div className="builder-head"><span>01</span><div><small>إعداد الجلسة</small><h2>وش جوّكم اليوم؟</h2></div></div>

        <div className="session-field"><span><Trophy/> نوع اللعب</span><div className="vibe-options"><button className={mode==='smart'?'active':''} onClick={()=>setMode('smart')}>جلسة ذكية</button><button className={mode==='tournament'?'active':''} onClick={()=>setMode('tournament')}>بطولة</button></div></div>

        {mode==='tournament' && <div className="session-field"><span><Users/> أسماء الفرق</span><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><input value={tournament.teamA} onChange={e=>setTournament(current=>({...current,teamA:e.target.value||'الفريق الأول'}))} aria-label="اسم الفريق الأول" style={{minWidth:0,padding:'12px 14px',borderRadius:14,border:'1px solid #d7a93b55',background:'#0b0b0b',color:'white'}}/><input value={tournament.teamB} onChange={e=>setTournament(current=>({...current,teamB:e.target.value||'الفريق الثاني'}))} aria-label="اسم الفريق الثاني" style={{minWidth:0,padding:'12px 14px',borderRadius:14,border:'1px solid #d7a93b55',background:'#0b0b0b',color:'white'}}/></div></div>}

        <label className="session-field"><span><Users/> عدد اللاعبين</span><div className="stepper"><button onClick={() => setPlayers(value => Math.max(2, value - 1))}>−</button><strong>{players}</strong><button onClick={() => setPlayers(value => Math.min(24, value + 1))}>+</button></div></label>

        <label className="session-field"><span><Clock3/> مدة الجلسة</span><div className="duration-options">{[30,45,60,90].map(value => <button key={value} className={duration === value ? 'active' : ''} onClick={() => setDuration(value)}>{value} دقيقة</button>)}</div></label>

        <div className="session-field"><span><Gamepad2/> نوع الجلسة</span><div className="vibe-options">{(Object.keys(vibeLabels) as Vibe[]).map(value => <button key={value} className={vibe === value ? 'active' : ''} onClick={() => setVibe(value)}>{vibeLabels[value]}</button>)}</div></div>

        <button className="primary session-build" onClick={build}><WandSparkles/> {mode==='tournament'?'أنشئ البطولة':'رتّب جلستنا'}</button>
        {generated && <button className="quiet" onClick={remix} style={{width:'100%',justifyContent:'center',marginTop:8}}><Shuffle/> غيّر الخطة</button>}
        {mode==='tournament' && generated && <button className="quiet" onClick={resetTournament} style={{width:'100%',justifyContent:'center',marginTop:8}}><RotateCcw/> تصفير نقاط البطولة</button>}
      </aside>

      <div className={`session-plan ${generated ? 'ready' : ''}`}>
        <div className="builder-head"><span>02</span><div><small>{mode==='tournament'?'لوحة البطولة':'الخطة المقترحة'}</small><h2>{generated ? `${plan.length} ألعاب · ${duration} دقيقة` : 'جاهزة أول ما تختارون'}</h2></div></div>

        {!generated ? <div className="plan-empty"><Shuffle/><h3>خلو الاختيار علينا</h3><p>نرتب البداية والوسط والنهاية، ونبعد قدر الإمكان عن الألعاب اللي لعبتوها مؤخرًا.</p></div> : <>
          <div className="plan-summary"><span><Users/> {players} لاعبين</span><span><Clock3/> قرابة {perGame} دقائق لكل لعبة</span><span><Sparkles/> {vibeLabels[vibe]}</span><span><Check/> {doneCount}/{plan.length} مكتملة</span></div>

          {importNotice && <div role="status" style={{padding:'12px 14px',margin:'10px 0 14px',border:'1px solid #5fc78440',borderRadius:15,background:'#5fc7840c',color:'#a9e1ba',fontSize:12,fontWeight:800}}><Check/> {importNotice}</div>}

          {nextGame && <div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',padding:'14px 16px',margin:'10px 0 16px',border:'1px solid #d7a93b44',borderRadius:18,background:'#d7a93b0b'}}><div><small style={{color:'#b99a55'}}>اقتراح قدّها للجولة التالية</small><strong style={{display:'block',marginTop:3}}>{nextGame.title}</strong></div><button className="primary" onClick={()=>launch(nextGame.id)}><Play/> ابدأ التالي</button></div>}

          {mode==='tournament' && <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:12,alignItems:'center',padding:'18px',margin:'12px 0 16px',border:'1px solid #d7a93b55',borderRadius:20,background:'linear-gradient(135deg,#111,#17120a)'}}><div style={{textAlign:'center'}}><small style={{color:'#b99a55'}}>الفريق</small><strong style={{display:'block',fontSize:18}}>{tournament.teamA}</strong><b style={{display:'block',fontSize:34,color:'#e7bc4f'}}>{totalA}</b></div><Trophy style={{color:'#e7bc4f'}}/><div style={{textAlign:'center'}}><small style={{color:'#b99a55'}}>الفريق</small><strong style={{display:'block',fontSize:18}}>{tournament.teamB}</strong><b style={{display:'block',fontSize:34,color:'#e7bc4f'}}>{totalB}</b></div>{allDone&&<div style={{gridColumn:'1 / -1',textAlign:'center',paddingTop:10,borderTop:'1px solid #d7a93b33'}}><span style={{color:'#b99a55'}}>النتيجة النهائية · محفوظة في سجل البطولات</span><h3 style={{margin:'4px 0 0'}}>{leader==='تعادل'?'تعادل قوي 👏':`🏆 ${leader} بطل الجلسة`}</h3></div>}</div>}

          {mode==='smart' && allDone && <div style={{textAlign:'center',padding:'18px',margin:'12px 0 16px',border:'1px solid #d7a93b55',borderRadius:20,background:'linear-gradient(135deg,#111,#17120a)'}}><Trophy style={{color:'#e7bc4f'}}/><h3 style={{margin:'8px 0 4px'}}>خلصتوا الجلسة كاملة 👏</h3><p style={{margin:0,color:'#b9b3a7'}}>تبون جولة ثانية؟ اضغطوا «غيّر الخطة» ونجيب لكم تشكيلة مختلفة.</p></div>}

          <div className="plan-list">{plan.map((game, index) => {
            const gameScore=tournament.scores[game.id]||{a:0,b:0};
            const done=completed.includes(game.id);
            return <article key={game.id} className={`${started === game.id ? 'active' : ''} ${done?'completed':''}`}><span className="plan-number">{done?'✓':String(index + 1).padStart(2, '0')}</span><div><small>{index === 0 ? 'افتتاحية' : index === plan.length - 1 ? 'الختام' : 'الجولة التالية'}</small><h3>{game.title}</h3><p>{game.tag}</p><div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>{mode==='tournament'&&<><button className="quiet" onClick={()=>score(game.id,'a',1)}>+ {tournament.teamA} <b>{gameScore.a}</b></button><button className="quiet" onClick={()=>score(game.id,'b',1)}>+ {tournament.teamB} <b>{gameScore.b}</b></button></>}<button className="quiet" onClick={()=>toggleComplete(game.id)}>{done?'إلغاء الإكمال':'تمت الجولة'}</button></div></div><button onClick={() => launch(game.id)}><Play/> ابدأ</button></article>;
          })}</div>
        </>}
      </div>
    </div>

    <div className="session-tech-row">
      <article><Cast/><div><b>وضع التلفزيون جاهز</b><span>واجهة الشاشة الكبيرة موجودة أصلًا ونستخدمها هنا بدل تكرارها.</span></div><Check/></article>
      <article><QrCode/><div><b>دخول QR</b><span>متوفر حاليًا في تجربة المقدم، وبيكون أساس ربط الجلسات الجماعية.</span></div><Check/></article>
      <article><Smartphone/><div><b>رجوع ذكي للبطولة</b><span>اللعبة التي تبدأ من مدير الجلسة ترجعك له، والنتائج المدعومة تدخل تلقائيًا.</span></div><Check/></article>
      <article><Trophy/><div><b>سجل البطولات</b><span>نتيجة كل بطولة مكتملة تُحفظ محليًا تلقائيًا للرجوع لها من ملف اللاعب.</span></div><Check/></article>
    </div>
  </section>;
}
