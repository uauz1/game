import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Brain, Cast, Check, Clock3, Gamepad2, Play, QrCode, RotateCcw, Shuffle, Smartphone, Sparkles, Trophy, Users, WandSparkles } from 'lucide-react';

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

const STORAGE_KEY = 'qaddha.smart-session.v2';

const vibeLabels: Record<Vibe, string> = {
  balanced: 'متوازنة',
  fast: 'حماس وسرعة',
  brain: 'ذكاء وتخمين',
  family: 'عائلية وخفيفة',
};

const preferredByVibe: Record<Vibe, string[]> = {
  balanced: ['teams', 'letters', 'family', 'connection', 'photo', 'fast', 'riddles', 'who', 'character', 'words'],
  fast: ['fast', 'letters', 'photo', 'connection', 'teams', 'family', 'riddles', 'character', 'who', 'words'],
  brain: ['connection', 'riddles', 'who', 'character', 'letters', 'teams', 'family', 'words', 'photo', 'fast'],
  family: ['family', 'teams', 'photo', 'riddles', 'connection', 'letters', 'who', 'character', 'words', 'fast'],
};

function pickPlan(games: SessionGame[], vibe: Vibe, duration: number, players: number) {
  const gameCount = duration <= 30 ? 3 : duration <= 50 ? 4 : duration <= 75 ? 5 : 6;
  const order = preferredByVibe[vibe];
  const sorted = [...games].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });
  const plan = sorted.slice(0, Math.min(gameCount, sorted.length));
  if (players >= 10) {
    const teams = plan.findIndex(game => game.id === 'teams');
    if (teams > 0) [plan[0], plan[teams]] = [plan[teams], plan[0]];
  }
  return plan;
}

function readSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      mode: raw.mode === 'tournament' ? 'tournament' as Mode : 'smart' as Mode,
      generated: Boolean(raw.generated),
      players: typeof raw.players === 'number' ? raw.players : 8,
      duration: [30,45,60,90].includes(raw.duration) ? raw.duration : 45,
      vibe: (['balanced','fast','brain','family'] as Vibe[]).includes(raw.vibe) ? raw.vibe as Vibe : 'balanced' as Vibe,
      tournament: {
        teamA: typeof raw.tournament?.teamA === 'string' ? raw.tournament.teamA : 'الفريق الأول',
        teamB: typeof raw.tournament?.teamB === 'string' ? raw.tournament.teamB : 'الفريق الثاني',
        scores: raw.tournament?.scores && typeof raw.tournament.scores === 'object' ? raw.tournament.scores : {},
        completed: Array.isArray(raw.tournament?.completed) ? raw.tournament.completed : [],
      } as TournamentState,
    };
  } catch {
    return { mode:'smart' as Mode, generated:false, players:8, duration:45, vibe:'balanced' as Vibe, tournament:{ teamA:'الفريق الأول', teamB:'الفريق الثاني', scores:{}, completed:[] } as TournamentState };
  }
}

export default function SmartPartySession({ games, onBack, onPlay }: Props) {
  const saved = useMemo(readSaved, []);
  const [players, setPlayers] = useState(saved.players);
  const [duration, setDuration] = useState(saved.duration);
  const [vibe, setVibe] = useState<Vibe>(saved.vibe);
  const [mode, setMode] = useState<Mode>(saved.mode);
  const [generated, setGenerated] = useState(saved.generated);
  const [started, setStarted] = useState<string | null>(null);
  const [tournament, setTournament] = useState<TournamentState>(saved.tournament);

  const plan = useMemo(() => pickPlan(games, vibe, duration, players), [games, vibe, duration, players]);
  const perGame = Math.max(7, Math.floor(duration / Math.max(plan.length, 1)));
  const totalA = plan.reduce((sum, game) => sum + (tournament.scores[game.id]?.a || 0), 0);
  const totalB = plan.reduce((sum, game) => sum + (tournament.scores[game.id]?.b || 0), 0);
  const allDone = generated && plan.length > 0 && plan.every(game => tournament.completed.includes(game.id));
  const leader = totalA === totalB ? 'تعادل' : totalA > totalB ? tournament.teamA : tournament.teamB;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, generated, players, duration, vibe, tournament }));
    } catch {/* Session persistence is optional. */}
  }, [mode, generated, players, duration, vibe, tournament]);

  const build = () => {
    setGenerated(true);
    setStarted(null);
    if (mode === 'tournament') setTournament(current => ({ ...current, scores: {}, completed: [] }));
  };

  const score = (gameId: string, side: 'a'|'b', delta: number) => {
    setTournament(current => {
      const previous = current.scores[gameId] || { a: 0, b: 0 };
      const next = { ...previous, [side]: Math.max(0, previous[side] + delta) };
      return { ...current, scores: { ...current.scores, [gameId]: next } };
    });
  };

  const toggleComplete = (gameId: string) => {
    setTournament(current => ({
      ...current,
      completed: current.completed.includes(gameId) ? current.completed.filter(id => id !== gameId) : [...current.completed, gameId],
    }));
  };

  const resetTournament = () => setTournament(current => ({ ...current, scores: {}, completed: [] }));

  return <section className="smart-session" dir="rtl">
    <div className="session-topline">
      <button className="quiet session-back" onClick={onBack}><ArrowLeft/> الرئيسية</button>
      <span className="session-badge"><Sparkles/> مدير جلسة + بطولة</span>
    </div>

    <div className="session-hero">
      <div>
        <span className="eyebrow"><WandSparkles/> مدير الجلسة الذكي</span>
        <h1>قول لنا جمعتكم.<br/><em>ونرتب اللعب عليكم.</em></h1>
        <p>اختار جلسة سريعة أو بطولة كاملة. قدّها يرتب الألعاب، يحفظ التقدم، ويجمع النقاط حتى لو خرجت ورجعت.</p>
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
        {mode==='tournament' && generated && <button className="quiet" onClick={resetTournament} style={{width:'100%',justifyContent:'center',marginTop:8}}><RotateCcw/> تصفير نقاط البطولة</button>}
      </aside>

      <div className={`session-plan ${generated ? 'ready' : ''}`}>
        <div className="builder-head"><span>02</span><div><small>{mode==='tournament'?'لوحة البطولة':'الخطة المقترحة'}</small><h2>{generated ? `${plan.length} ألعاب · ${duration} دقيقة` : 'جاهزة أول ما تختارون'}</h2></div></div>

        {!generated ? <div className="plan-empty"><Shuffle/><h3>خلو الاختيار علينا</h3><p>نرتب البداية والوسط والنهاية عشان الجلسة ما تهدأ ولا تصير كلها نفس النوع.</p></div> : <>
          <div className="plan-summary"><span><Users/> {players} لاعبين</span><span><Clock3/> قرابة {perGame} دقائق لكل لعبة</span><span><Sparkles/> {vibeLabels[vibe]}</span></div>

          {mode==='tournament' && <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:12,alignItems:'center',padding:'18px',margin:'12px 0 16px',border:'1px solid #d7a93b55',borderRadius:20,background:'linear-gradient(135deg,#111,#17120a)'}}><div style={{textAlign:'center'}}><small style={{color:'#b99a55'}}>الفريق</small><strong style={{display:'block',fontSize:18}}>{tournament.teamA}</strong><b style={{display:'block',fontSize:34,color:'#e7bc4f'}}>{totalA}</b></div><Trophy style={{color:'#e7bc4f'}}/><div style={{textAlign:'center'}}><small style={{color:'#b99a55'}}>الفريق</small><strong style={{display:'block',fontSize:18}}>{tournament.teamB}</strong><b style={{display:'block',fontSize:34,color:'#e7bc4f'}}>{totalB}</b></div>{allDone&&<div style={{gridColumn:'1 / -1',textAlign:'center',paddingTop:10,borderTop:'1px solid #d7a93b33'}}><span style={{color:'#b99a55'}}>النتيجة النهائية</span><h3 style={{margin:'4px 0 0'}}>{leader==='تعادل'?'تعادل قوي 👏':`🏆 ${leader} بطل الجلسة`}</h3></div>}</div>}

          <div className="plan-list">{plan.map((game, index) => {
            const gameScore=tournament.scores[game.id]||{a:0,b:0};
            const done=tournament.completed.includes(game.id);
            return <article key={game.id} className={`${started === game.id ? 'active' : ''} ${done?'completed':''}`}><span className="plan-number">{done?'✓':String(index + 1).padStart(2, '0')}</span><div><small>{index === 0 ? 'افتتاحية' : index === plan.length - 1 ? 'الختام' : 'الجولة التالية'}</small><h3>{game.title}</h3><p>{game.tag}</p>{mode==='tournament'&&<div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}><button className="quiet" onClick={()=>score(game.id,'a',1)}>+ {tournament.teamA} <b>{gameScore.a}</b></button><button className="quiet" onClick={()=>score(game.id,'b',1)}>+ {tournament.teamB} <b>{gameScore.b}</b></button><button className="quiet" onClick={()=>toggleComplete(game.id)}>{done?'إلغاء الإكمال':'تمت الجولة'}</button></div>}</div><button onClick={() => { setStarted(game.id); onPlay(game.id); }}><Play/> ابدأ</button></article>;
          })}</div>
        </>}
      </div>
    </div>

    <div className="session-tech-row">
      <article><Cast/><div><b>وضع التلفزيون جاهز</b><span>واجهة الشاشة الكبيرة موجودة أصلًا ونستخدمها هنا بدل تكرارها.</span></div><Check/></article>
      <article><QrCode/><div><b>دخول QR</b><span>متوفر حاليًا في تجربة المقدم، وبيكون أساس ربط الجلسات الجماعية.</span></div><Check/></article>
      <article><Smartphone/><div><b>الجوال كمقدم</b><span>التحكم الحي موجود في تحدي العائلة ومهيأ للتوسعة لباقي الألعاب.</span></div><Check/></article>
      <article><Trophy/><div><b>بطولة محفوظة</b><span>نقاط الفرق وتقدم الجولات تبقى محفوظة على نفس الجهاز حتى ترجع تكمل.</span></div><Check/></article>
    </div>
  </section>;
}
