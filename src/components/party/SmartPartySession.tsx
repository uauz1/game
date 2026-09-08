import { useMemo, useState } from 'react';
import { ArrowLeft, Brain, Cast, Check, Clock3, Gamepad2, Play, QrCode, Shuffle, Smartphone, Sparkles, Trophy, Users, WandSparkles } from 'lucide-react';

export type SessionGame = {
  id: string;
  title: string;
  tag: string;
};

type Vibe = 'balanced' | 'fast' | 'brain' | 'family';

type Props = {
  games: SessionGame[];
  onBack: () => void;
  onPlay: (gameId: string) => void;
};

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
  const sorted = [...games].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const plan = sorted.slice(0, Math.min(gameCount, sorted.length));
  if (players >= 10) {
    const teams = plan.findIndex(game => game.id === 'teams');
    if (teams > 0) [plan[0], plan[teams]] = [plan[teams], plan[0]];
  }
  return plan;
}

export default function SmartPartySession({ games, onBack, onPlay }: Props) {
  const [players, setPlayers] = useState(8);
  const [duration, setDuration] = useState(45);
  const [vibe, setVibe] = useState<Vibe>('balanced');
  const [generated, setGenerated] = useState(false);
  const [started, setStarted] = useState<string | null>(null);

  const plan = useMemo(() => pickPlan(games, vibe, duration, players), [games, vibe, duration, players]);
  const perGame = Math.max(7, Math.floor(duration / Math.max(plan.length, 1)));

  const build = () => {
    setGenerated(true);
    setStarted(null);
  };

  return <section className="smart-session" dir="rtl">
    <div className="session-topline">
      <button className="quiet session-back" onClick={onBack}><ArrowLeft/> الرئيسية</button>
      <span className="session-badge"><Sparkles/> جديد في قدّها</span>
    </div>

    <div className="session-hero">
      <div>
        <span className="eyebrow"><WandSparkles/> مدير الجلسة الذكي</span>
        <h1>قول لنا جمعتكم.<br/><em>ونرتب اللعب عليكم.</em></h1>
        <p>حدد العدد والوقت وجو الجلسة، وقدّها يكوّن لكم برنامج ألعاب متوازن بدون حوسة الاختيار كل مرة.</p>
      </div>
      <div className="session-orb" aria-hidden="true"><Brain/><span>AI<br/>GM</span></div>
    </div>

    <div className="session-layout">
      <aside className="session-builder">
        <div className="builder-head"><span>01</span><div><small>إعداد الجلسة</small><h2>وش جوّكم اليوم؟</h2></div></div>

        <label className="session-field"><span><Users/> عدد اللاعبين</span><div className="stepper"><button onClick={() => setPlayers(value => Math.max(2, value - 1))}>−</button><strong>{players}</strong><button onClick={() => setPlayers(value => Math.min(24, value + 1))}>+</button></div></label>

        <label className="session-field"><span><Clock3/> مدة الجلسة</span><div className="duration-options">{[30,45,60,90].map(value => <button key={value} className={duration === value ? 'active' : ''} onClick={() => setDuration(value)}>{value} دقيقة</button>)}</div></label>

        <div className="session-field"><span><Gamepad2/> نوع الجلسة</span><div className="vibe-options">{(Object.keys(vibeLabels) as Vibe[]).map(value => <button key={value} className={vibe === value ? 'active' : ''} onClick={() => setVibe(value)}>{vibeLabels[value]}</button>)}</div></div>

        <button className="primary session-build" onClick={build}><WandSparkles/> رتّب جلستنا</button>
      </aside>

      <div className={`session-plan ${generated ? 'ready' : ''}`}>
        <div className="builder-head"><span>02</span><div><small>الخطة المقترحة</small><h2>{generated ? `${plan.length} ألعاب · ${duration} دقيقة` : 'جاهزة أول ما تختارون'}</h2></div></div>

        {!generated ? <div className="plan-empty"><Shuffle/><h3>خلو الاختيار علينا</h3><p>نرتب البداية والوسط والنهاية عشان الجلسة ما تهدأ ولا تصير كلها نفس النوع.</p></div> : <>
          <div className="plan-summary"><span><Users/> {players} لاعبين</span><span><Clock3/> قرابة {perGame} دقائق لكل لعبة</span><span><Sparkles/> {vibeLabels[vibe]}</span></div>
          <div className="plan-list">{plan.map((game, index) => <article key={game.id} className={started === game.id ? 'active' : ''}><span className="plan-number">{String(index + 1).padStart(2, '0')}</span><div><small>{index === 0 ? 'افتتاحية' : index === plan.length - 1 ? 'الختام' : 'الجولة التالية'}</small><h3>{game.title}</h3><p>{game.tag}</p></div><button onClick={() => { setStarted(game.id); onPlay(game.id); }}><Play/> ابدأ</button></article>)}</div>
        </>}
      </div>
    </div>

    <div className="session-tech-row">
      <article><Cast/><div><b>وضع التلفزيون جاهز</b><span>واجهة الشاشة الكبيرة موجودة أصلًا ونستخدمها هنا بدل تكرارها.</span></div><Check/></article>
      <article><QrCode/><div><b>دخول QR</b><span>متوفر حاليًا في تجربة المقدم، وبيكون أساس ربط الجلسات الجماعية.</span></div><Check/></article>
      <article><Smartphone/><div><b>الجوال كمقدم</b><span>التحكم الحي موجود في تحدي العائلة ومهيأ للتوسعة لباقي الألعاب.</span></div><Check/></article>
      <article><Trophy/><div><b>جلسة واحدة، أكثر من لعبة</b><span>الخطة تحافظ على تنوع الألعاب بدل تكرار نفس نوع التحدي.</span></div><Check/></article>
    </div>
  </section>;
}
