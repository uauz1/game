import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, Brain, Check, ChevronLeft, Eye, Flag, Lightbulb, RotateCcw, Sparkles, Trophy, Users, X } from 'lucide-react';
import { cardsForDifficulty, type WhoAmICard, type WhoAmIDifficulty } from '../../data/whoAmIQuestions';
import { drawWhoAmICards, loadWhoAmIPreferences, saveWhoAmIPreferences } from '../../utils/whoAmIStorage';
import Countdown from './Countdown';

type Phase = 'setup' | 'playing' | 'result';
type Team = { name: string; color: string; score: number; answers: number };
type LastDecision = { round: number; team: 0 | 1 | null; points: number; clueCount: number };

const TEAM_COLORS = [
  { value: '#45b6ff', name: 'أزرق' },
  { value: '#ff70b5', name: 'وردي' },
  { value: '#a77bff', name: 'بنفسجي' },
  { value: '#ffd45a', name: 'ذهبي' },
];

export default function WhoAmIGame({ onHome }: { onHome: () => void }) {
  const [preferences] = useState(loadWhoAmIPreferences);
  const [teams, setTeams] = useState<Team[]>([
    { name: preferences.teamNames[0], color: preferences.teamColors[0], score: 0, answers: 0 },
    { name: preferences.teamNames[1], color: preferences.teamColors[1], score: 0, answers: 0 },
  ]);
  const [difficulty, setDifficulty] = useState<WhoAmIDifficulty>(preferences.difficulty);
  const [seconds, setSeconds] = useState(preferences.seconds);
  const [roundCount, setRoundCount] = useState(preferences.roundCount);
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [deck, setDeck] = useState<WhoAmICard[]>([]);
  const [clueCount, setClueCount] = useState(1);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [lastDecision, setLastDecision] = useState<LastDecision | null>(null);
  const [exit, setExit] = useState(false);

  const currentCard = deck[round];
  const turn = round % 2 as 0 | 1;
  const availablePoints = Math.max(100, (5 - clueCount) * 100);
  const validNames = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();
  const winner = useMemo(() => {
    if (teams[0].score === teams[1].score) return null;
    return teams[0].score > teams[1].score ? 0 : 1;
  }, [teams]);

  useEffect(() => {
    saveWhoAmIPreferences({
      teamNames: [teams[0].name, teams[1].name],
      teamColors: [teams[0].color, teams[1].color],
      seconds,
      difficulty,
      roundCount,
    });
  }, [difficulty, roundCount, seconds, teams]);

  const updateTeam = (index: number, patch: Partial<Team>) => {
    setTeams(current => current.map((team, teamIndex) => teamIndex === index ? { ...team, ...patch } : team));
  };

  const startGame = () => {
    if (!validNames) return;
    const nextDeck = drawWhoAmICards(cardsForDifficulty(difficulty), roundCount, difficulty);
    if (!nextDeck.length) return;
    setTeams(current => current.map(team => ({ ...team, name: team.name.trim(), score: 0, answers: 0 })));
    setDeck(nextDeck);
    setRound(0);
    setClueCount(1);
    setAnswerRevealed(false);
    setLastDecision(null);
    setPhase('playing');
  };

  const judge = (teamIndex: 0 | 1 | null) => {
    if (!answerRevealed) return;
    setLastDecision({ round, team: teamIndex, points: availablePoints, clueCount });
    if (teamIndex !== null) {
      setTeams(current => current.map((team, index) => index === teamIndex
        ? { ...team, score: team.score + availablePoints, answers: team.answers + 1 }
        : team));
    }
    if (round + 1 >= deck.length) {
      setPhase('result');
      return;
    }
    setRound(value => value + 1);
    setClueCount(1);
    setAnswerRevealed(false);
  };

  const restart = () => {
    const nextDeck = drawWhoAmICards(cardsForDifficulty(difficulty), roundCount, difficulty);
    if (!nextDeck.length) return;
    setDeck(nextDeck);
    setTeams(current => current.map(team => ({ ...team, score: 0, answers: 0 })));
    setRound(0);
    setClueCount(1);
    setAnswerRevealed(false);
    setLastDecision(null);
    setPhase('playing');
  };

  const undoJudge = () => {
    if (!lastDecision) return;
    if (lastDecision.team !== null) {
      setTeams(current => current.map((team, index) => index === lastDecision.team
        ? { ...team, score: Math.max(0, team.score - lastDecision.points), answers: Math.max(0, team.answers - 1) }
        : team));
    }
    setRound(lastDecision.round);
    setClueCount(lastDecision.clueCount);
    setAnswerRevealed(true);
    setLastDecision(null);
    setPhase('playing');
  };

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (exit) setExit(false);
      else if (phase === 'playing') setExit(true);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [exit, phase]);

  return <section className="arena who-arena" aria-label="لعبة من أنا">
    <div className="arena-heading"><div><span className="eyebrow"><Brain size={16}/> من أنا؟</span><h1>{phase === 'setup' ? 'كل تلميح له ثمن.' : phase === 'result' ? 'انكشفت الشخصيات!' : `الشخصية ${round + 1} من ${deck.length}`}</h1></div><button className="quiet" onClick={() => phase === 'playing' ? setExit(true) : onHome()}>الألعاب <ArrowLeft size={17}/></button></div>

    {phase === 'setup' ? <div className="who-setup">
      <div className="section-heading"><h2>جهّزوا المواجهة</h2><p>تبدأ الشخصية بتلميح صعب. كل تلميح إضافي يقرّب الحل ويقلّل النقاط.</p></div>
      <div className="team-setup">{teams.map((team, index) => <div className="team-editor" key={index} style={{ '--team': team.color } as CSSProperties}>
        <div className="team-emblem"><Users size={36}/><span>0{index + 1}</span></div>
        <label htmlFor={`who-team-${index}`}>اسم الفريق {index === 0 ? 'الأول' : 'الثاني'}</label>
        <input id={`who-team-${index}`} maxLength={22} value={team.name} onChange={event => updateTeam(index, { name: event.target.value })}/>
        <div className="color-choices" aria-label={`لون الفريق ${index + 1}`}>{TEAM_COLORS.map(color => <button type="button" key={color.value} aria-label={`${color.name} للفريق ${index + 1}`} aria-pressed={team.color === color.value} disabled={teams[1 - index].color === color.value} style={{ background: color.value }} onClick={() => updateTeam(index, { color: color.value })}>{team.color === color.value ? <Check size={17}/> : null}</button>)}</div>
      </div>)}</div>
      <div className="match-settings who-settings"><div><Flag/><b>إعدادات الجولة</b></div>
        <label>مدة الشخصية<select aria-label="مدة الشخصية" value={seconds} onChange={event => setSeconds(Number(event.target.value))}><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label>
        <label>المستوى<select aria-label="مستوى الشخصيات" value={difficulty} onChange={event => setDifficulty(event.target.value as WhoAmIDifficulty)}><option value="easy">خفيف</option><option value="medium">متوازن</option><option value="hard">للمحترفين</option></select></label>
        <label>عدد الشخصيات<select aria-label="عدد الشخصيات" value={roundCount} onChange={event => setRoundCount(Number(event.target.value))}><option value={6}>6 شخصيات</option><option value={8}>8 شخصيات</option><option value={10}>10 شخصيات</option></select></label>
        <small className="auto-save-note">تُحفظ اختياراتكم تلقائيًا على هذا الجهاز.</small>
      </div>
      {!validNames ? <p className="validation" role="status">اكتبوا اسمين مختلفين وغير فارغين.</p> : null}
      <div className="arena-actions"><span>400 نقطة من أول تلميح، وتقل 100 مع كل تلميح إضافي.</span><button className="primary" disabled={!validNames} onClick={startGame}>ابدأوا التخمين <ChevronLeft size={18}/></button></div>
      <div className="host-note"><span>✦</span><p><b>مهمة المقدم:</b> يكشف التلميحات عند الحاجة، ثم يكشف الإجابة ويسجل الفريق الذي عرف الشخصية. يستطيع الفريق الآخر خطف الإجابة.</p></div>
    </div> : null}

    {phase === 'playing' && currentCard ? <>
      <div className="who-scorebar">{teams.map((team, index) => <div key={index} className={`who-team-score ${turn === index ? 'is-turn' : ''}`} style={{ '--team': team.color } as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong><small>{team.answers} إجابات صحيحة</small></div>)}<div className="who-round"><small>الدور الأساسي</small><b>{teams[turn].name}</b><span>{currentCard.category}</span></div></div>
      <div className="who-stage">
        <div className="who-progress" aria-label="تقدم الجولة">{deck.map((card, index) => <span key={card.id} className={index < round ? 'done' : index === round ? 'current' : ''}>{index + 1}</span>)}</div>{lastDecision?<button className="quiet who-undo" onClick={undoJudge}><RotateCcw size={15}/> تصحيح آخر تحكيم</button>:null}
        <div className="mystery-avatar" aria-hidden="true"><span>؟</span><Sparkles/></div>
        <div className="who-value"><small>قيمة الإجابة الآن</small><strong>{availablePoints}</strong><span>نقطة</span></div>
        <div className="who-clues" aria-live="polite">{currentCard.clues.slice(0, clueCount).map((clue, index) => <div className="who-clue" key={clue}><span>{index + 1}</span><p>{clue}</p></div>)}</div>
        <Countdown key={currentCard.id} seconds={seconds} stopped={answerRevealed} onExpire={() => setAnswerRevealed(true)}/>
        {!answerRevealed ? <div className="who-actions"><button className="secondary" disabled={clueCount === currentCard.clues.length} onClick={() => setClueCount(value => Math.min(currentCard.clues.length, value + 1))}><Lightbulb size={18}/> تلميح إضافي {clueCount < 4 ? `− 100` : ''}</button><button className="primary" onClick={() => setAnswerRevealed(true)}><Eye size={18}/> كشف الإجابة</button></div> : <div className="who-reveal" role="status"><small>أنا…</small><h2>{currentCard.answer}</h2><p>من عرفها؟ سجّل النقاط أو مرّر الشخصية بلا نقاط.</p><div className="who-judging"><button style={{ '--team': teams[0].color } as CSSProperties} onClick={() => judge(0)}><Check/> {teams[0].name} · +{availablePoints}</button><button style={{ '--team': teams[1].color } as CSSProperties} onClick={() => judge(1)}><Check/> {teams[1].name} · +{availablePoints}</button><button className="no-winner" onClick={() => judge(null)}><X/> لا أحد</button></div></div>}
      </div>
    </> : null}

    {phase === 'result' ? <div className="who-result"><Trophy size={70}/><span className="eyebrow">نهاية التحدّي</span>{winner === null ? <><h2>تعادل يستاهل جولة ثانية!</h2><p>الفريقان جمعا {teams[0].score} نقطة.</p></> : <><h2>{teams[winner].name}… عرفوها!</h2><p>حسموا التحدّي بفارق {Math.abs(teams[0].score - teams[1].score)} نقطة.</p></>}<div className="who-result-scores">{teams.map(team => <span key={team.name} style={{ '--team': team.color } as CSSProperties}><small>{team.name}</small><strong>{team.score}</strong><em>{team.answers} صحيحة</em></span>)}</div><div className="result-actions"><button className="primary" onClick={restart}><RotateCcw size={18}/> إعادة بنفس الإعدادات</button><button className="secondary" onClick={() => setPhase('setup')}>تعديل الإعدادات</button></div>{lastDecision?<button className="quiet who-result-undo" onClick={undoJudge}><RotateCcw size={15}/> تصحيح آخر تحكيم</button>:null}</div> : null}

    {exit ? <div className="exit-overlay"><div role="dialog" aria-modal="true" aria-labelledby="who-exit"><h2 id="who-exit">نوقف لعبة من أنا؟</h2><p>العودة للألعاب تنهي الجولة الحالية ونقاطها.</p><button autoFocus className="primary" onClick={() => setExit(false)}>نكمل اللعب</button><button className="quiet" onClick={onHome}>إنهاء والعودة للألعاب</button></div></div> : null}
  </section>;
}
