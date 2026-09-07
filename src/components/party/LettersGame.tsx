import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, Check, CircleHelp, Eye, Flag, RotateCcw, Sparkles, Trophy, Undo2, Users, X } from 'lucide-react';
import { HUROOF_LETTERS, questionsForLetter, type HuroofDifficulty, type HuroofQuestion } from '../../data/huroofQuestions';
import { findWinningPath, type CellOwner } from '../../utils/huroofPath';
import { loadHuroofPreferences, saveHuroofPreferences } from '../../utils/huroofStorage';
import Countdown from './Countdown';

const BOARD_SIZE = 5;
const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
const TEAM_COLORS = [
  { value: '#45b6ff', name: 'أزرق' },
  { value: '#ff70b5', name: 'وردي' },
  { value: '#a77bff', name: 'بنفسجي' },
  { value: '#ffd45a', name: 'ذهبي' },
];

type Team = { name: string; color: string; rounds: number };
type Phase = 'setup' | 'board' | 'question' | 'round-end' | 'match-end';
type CurrentQuestion = { cell: number; question: HuroofQuestion };
type MatchStats = { asked: number; correct: [number, number]; misses: number };
type LastDecision = { current: CurrentQuestion; team: 0 | 1; correct: boolean; wonRound: boolean };

function createBoard(round: number) {
  const letters = [...HUROOF_LETTERS];
  for (let index = letters.length - 1; index > 0; index -= 1) {
    const swapIndex = (index * 11 + round * 7) % (index + 1);
    [letters[index], letters[swapIndex]] = [letters[swapIndex], letters[index]];
  }
  return letters.slice(0, CELL_COUNT);
}

function requiredWins(bestOf: number) {
  return Math.floor(bestOf / 2) + 1;
}

const emptyStats = (): MatchStats => ({ asked: 0, correct: [0, 0], misses: 0 });

export default function LettersGame({ onHome }: { onHome: () => void }) {
  const [initialPreferences] = useState(loadHuroofPreferences);
  const [teams, setTeams] = useState<Team[]>([
    { name: initialPreferences.teamNames[0], color: initialPreferences.teamColors[0], rounds: 0 },
    { name: initialPreferences.teamNames[1], color: initialPreferences.teamColors[1], rounds: 0 },
  ]);
  const [seconds, setSeconds] = useState(initialPreferences.seconds);
  const [difficulty, setDifficulty] = useState<HuroofDifficulty>(initialPreferences.difficulty);
  const [bestOf, setBestOf] = useState(initialPreferences.bestOf);
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [letters, setLetters] = useState(() => createBoard(1));
  const [owners, setOwners] = useState<CellOwner[]>(() => Array(CELL_COUNT).fill(null));
  const [current, setCurrent] = useState<CurrentQuestion | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [winningPath, setWinningPath] = useState<number[]>([]);
  const [roundWinner, setRoundWinner] = useState<0 | 1 | null>(null);
  const [lastDecision, setLastDecision] = useState<LastDecision | null>(null);
  const [stats, setStats] = useState<MatchStats>(emptyStats);
  const [exit, setExit] = useState(false);
  const [rules, setRules] = useState(false);

  const targetWins = requiredWins(bestOf);
  const matchWinner = teams.findIndex(team => team.rounds >= targetWins) as -1 | 0 | 1;
  const validNames = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();
  const boardRows = useMemo(
    () => Array.from({ length: BOARD_SIZE }, (_, row) => letters.slice(row * BOARD_SIZE, (row + 1) * BOARD_SIZE)),
    [letters],
  );
  const teamStyle = (team: Team) => ({ '--team': team.color } as CSSProperties);

  useEffect(() => {
    saveHuroofPreferences({
      teamNames: [teams[0].name, teams[1].name],
      teamColors: [teams[0].color, teams[1].color],
      seconds,
      difficulty,
      bestOf,
    });
  }, [bestOf, difficulty, seconds, teams]);

  const updateTeam = (index: number, patch: Partial<Team>) => {
    setTeams(currentTeams => currentTeams.map((team, teamIndex) => teamIndex === index ? { ...team, ...patch } : team));
  };

  const resetBoard = (roundNumber: number, startingTeam: 0 | 1) => {
    setRound(roundNumber);
    setTurn(startingTeam);
    setLetters(createBoard(roundNumber));
    setOwners(Array(CELL_COUNT).fill(null));
    setCurrent(null);
    setRevealed(false);
    setWinningPath([]);
    setRoundWinner(null);
    setLastDecision(null);
    setPhase('board');
  };

  const startMatch = () => {
    if (!validNames) return;
    setTeams(currentTeams => currentTeams.map(team => ({ ...team, name: team.name.trim(), rounds: 0 })));
    setUsedQuestionIds([]);
    setStats(emptyStats());
    resetBoard(1, 0);
  };

  const restartMatch = () => {
    setTeams(currentTeams => currentTeams.map(team => ({ ...team, rounds: 0 })));
    setStats(emptyStats());
    resetBoard(1, 0);
  };

  const chooseCell = (cell: number) => {
    if (phase !== 'board' || owners[cell] !== null) return;
    const letter = letters[cell];
    const pool = questionsForLetter(letter, difficulty);
    const available = pool.filter(question => !usedQuestionIds.includes(question.id));
    const candidates = available.length ? available : pool;
    const question = candidates[(round + cell + usedQuestionIds.length) % candidates.length];
    if (!question) return;
    const poolIds = new Set(pool.map(item => item.id));
    setUsedQuestionIds(ids => available.length ? [...ids, question.id] : ids.filter(id => !poolIds.has(id)).concat(question.id));
    setCurrent({ cell, question });
    setRevealed(false);
    setPhase('question');
  };

  const cancelQuestion = () => {
    if (current) setUsedQuestionIds(ids => ids.filter(id => id !== current.question.id));
    setCurrent(null);
    setRevealed(false);
    setPhase('board');
  };

  const judge = (correct: boolean) => {
    if (!current || !revealed || phase !== 'question') return;
    const judgedQuestion = current;
    const judgingTeam = turn;
    setStats(value => ({
      asked: value.asked + 1,
      correct: correct ? value.correct.map((score, index) => index === judgingTeam ? score + 1 : score) as [number, number] : value.correct,
      misses: value.misses + (correct ? 0 : 1),
    }));

    if (!correct) {
      setLastDecision({ current: judgedQuestion, team: judgingTeam, correct: false, wonRound: false });
      setCurrent(null);
      setRevealed(false);
      setTurn(value => value === 0 ? 1 : 0);
      setPhase('board');
      return;
    }

    const nextOwners = [...owners];
    nextOwners[judgedQuestion.cell] = judgingTeam;
    const path = findWinningPath(nextOwners, BOARD_SIZE, judgingTeam);
    setOwners(nextOwners);
    setCurrent(null);
    setRevealed(false);
    setLastDecision({ current: judgedQuestion, team: judgingTeam, correct: true, wonRound: Boolean(path.length) });
    if (!path.length) {
      setTurn(value => value === 0 ? 1 : 0);
      setPhase('board');
      return;
    }

    const nextTeams = teams.map((team, index) => index === judgingTeam ? { ...team, rounds: team.rounds + 1 } : team);
    setTeams(nextTeams);
    setWinningPath(path);
    setRoundWinner(judgingTeam);
    setPhase(nextTeams[judgingTeam].rounds >= targetWins ? 'match-end' : 'round-end');
  };

  const undoDecision = () => {
    if (!lastDecision) return;
    if (lastDecision.correct) {
      setOwners(value => value.map((owner, index) => index === lastDecision.current.cell ? null : owner));
    }
    if (lastDecision.wonRound) {
      setTeams(value => value.map((team, index) => index === lastDecision.team ? { ...team, rounds: Math.max(0, team.rounds - 1) } : team));
    }
    setStats(value => ({
      asked: Math.max(0, value.asked - 1),
      correct: lastDecision.correct ? value.correct.map((score, index) => index === lastDecision.team ? Math.max(0, score - 1) : score) as [number, number] : value.correct,
      misses: Math.max(0, value.misses - (lastDecision.correct ? 0 : 1)),
    }));
    setWinningPath([]);
    setRoundWinner(null);
    setTurn(lastDecision.team);
    setCurrent(lastDecision.current);
    setRevealed(true);
    setLastDecision(null);
    setPhase('question');
  };

  const nextRound = () => {
    const nextRoundNumber = round + 1;
    resetBoard(nextRoundNumber, (nextRoundNumber - 1) % 2 as 0 | 1);
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (rules) setRules(false);
      else if (exit) setExit(false);
      else if (phase === 'question') {
        if (current) setUsedQuestionIds(ids => ids.filter(id => id !== current.question.id));
        setCurrent(null);
        setRevealed(false);
        setPhase('board');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [exit, phase, rules, current]);

  const isPlaying = phase !== 'setup' && phase !== 'match-end';
  return <section className="arena huroof-arena" aria-label="لعبة حروف مع عزيز">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={16}/> حروف مع عزيز</span><h1>{phase === 'setup' ? 'اربطوا الحروف… واقطعوا الطريق.' : phase === 'match-end' ? 'المسار حسمها!' : `الجولة ${round} · ابنوا المسار`}</h1></div><div className="arena-heading-actions"><button className="quiet" onClick={() => setRules(true)}><CircleHelp size={17}/> طريقة اللعب</button><button className="quiet" onClick={() => isPlaying ? setExit(true) : onHome()}>الألعاب <ArrowLeft size={17}/></button></div></div>

    {phase === 'setup' ? <div className="huroof-setup">
      <div className="section-heading"><h2>جهّزوا الفريقين</h2><p>الفريق الأول يصل اليمين باليسار، والثاني يصل الأعلى بالأسفل. أول مسار متصل يفوز بالجولة.</p></div>
      <div className="team-setup">{teams.map((team, index) => <div className="team-editor" key={index} style={teamStyle(team)}><div className="team-emblem"><Users size={36}/><span>0{index + 1}</span></div><label htmlFor={`huroof-team-${index}`}>اسم الفريق {index === 0 ? 'الأول' : 'الثاني'}</label><input id={`huroof-team-${index}`} aria-label={`اسم الفريق ${index + 1}`} maxLength={22} value={team.name} onChange={event => updateTeam(index, { name: event.target.value })}/><div className="color-choices" aria-label={`لون الفريق ${index + 1}`}>{TEAM_COLORS.map(color => <button type="button" key={color.value} aria-label={`${color.name} للفريق ${index + 1}`} aria-pressed={team.color === color.value} disabled={teams[1 - index].color === color.value} style={{ background: color.value }} onClick={() => updateTeam(index, { color: color.value })}>{team.color === color.value ? <Check size={17}/> : null}</button>)}</div><small>{index === 0 ? 'مساركم من اليمين إلى اليسار' : 'مساركم من الأعلى إلى الأسفل'}</small></div>)}</div>
      <div className="match-settings huroof-settings"><div><Flag/><b>إعدادات المباراة</b></div><label>مدة السؤال<select aria-label="مدة السؤال" value={seconds} onChange={event => setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>مستوى الأسئلة<select aria-label="مستوى الصعوبة" value={difficulty} onChange={event => setDifficulty(event.target.value as HuroofDifficulty)}><option value="easy">خفيف ومتنوع</option><option value="medium">متوازن</option><option value="hard">متقدم</option></select></label><label>نظام المباراة<select aria-label="عدد الجولات" value={bestOf} onChange={event => setBestOf(Number(event.target.value))}><option value={1}>جولة واحدة</option><option value={3}>الأفضل من 3</option><option value={5}>الأفضل من 5</option></select></label><small className="auto-save-note">تُحفظ اختياراتكم تلقائيًا على هذا الجهاز.</small></div>
      {!validNames ? <p className="validation" role="status">اكتبوا اسمين مختلفين وغير فارغين.</p> : null}
      <div className="arena-actions"><span>الإجابة الصحيحة تملك الخلية، ثم ينتقل الدور للفريق الآخر.</span><button className="primary" disabled={!validNames} onClick={startMatch}>ابدأوا المباراة <Flag size={18}/></button></div>
      <div className="host-note"><span>✦</span><p><b>المقدم يحكم الإجابات.</b> اختاروا خلية، جاوبوا بصوت عالٍ، اكشفوا الحل، ثم سجّلوا النتيجة. السؤال لا يتكرر حتى تنتهي مجموعة الحرف.</p></div>
    </div> : <>
      <div className="huroof-scorebar">{teams.map((team, index) => <div key={index} className={`huroof-team-score ${turn === index && phase === 'board' ? 'is-turn' : ''}`} style={teamStyle(team)}><span>{team.name}</span><strong>{team.rounds}<small> / {targetWins}</small></strong><small>{index === 0 ? 'يمين ↔ يسار' : 'أعلى ↕ أسفل'} · {stats.correct[index]} إجابات</small></div>)}<div className="huroof-round"><small>المباراة</small><b>الجولة {round}</b><span>{bestOf === 1 ? 'جولة حاسمة' : `الأفضل من ${bestOf}`}</span></div></div>

      <div className="huroof-board-shell" style={{ '--team-a': teams[0].color, '--team-b': teams[1].color } as CSSProperties}>
        <div className="path-edge edge-top"><span>{teams[1].name}</span></div><div className="path-edge edge-right"><span>{teams[0].name}</span></div>
        <div className="huroof-grid" role="grid" aria-label="شبكة الحروف">{boardRows.map((rowLetters, row) => <div className="huroof-row" role="row" key={row}>{rowLetters.map((letter, column) => { const cell = row * BOARD_SIZE + column; const owner = owners[cell]; const isPath = winningPath.includes(cell); return <button type="button" role="gridcell" key={cell} className={`huroof-cell ${owner === 0 ? 'owned-a' : owner === 1 ? 'owned-b' : ''} ${isPath ? 'winning-cell' : ''}`} disabled={owner !== null || phase !== 'board'} aria-label={`حرف ${letter}${owner !== null ? `، ملك ${teams[owner].name}` : ''}`} onClick={() => chooseCell(cell)}><span>{letter}</span>{owner !== null ? <Check aria-hidden="true" size={14}/> : null}</button>; })}</div>)}</div>
        <div className="path-edge edge-left"><span>{teams[0].name}</span></div><div className="path-edge edge-bottom"><span>{teams[1].name}</span></div>
      </div>

      {phase === 'board' ? <div className="huroof-turn" role="status"><span style={{ background: teams[turn].color }}/><p><b>الدور على {teams[turn].name}</b> — اختاروا خلية تساعدكم تكملون المسار أو تقطعون طريق الخصم.</p>{lastDecision ? <button className="quiet undo-decision" onClick={undoDecision}><Undo2 size={16}/> تصحيح آخر تحكيم</button> : null}</div> : null}

      {phase === 'question' && current ? <div className="huroof-question-overlay"><div className="huroof-question" role="dialog" aria-modal="true" aria-labelledby="huroof-question-title"><div className="huroof-question-head"><span className="letter-big">{letters[current.cell]}</span><div><small>سؤال {difficulty === 'easy' ? 'خفيف' : difficulty === 'medium' ? 'متوازن' : 'متقدم'}</small><b>{teams[turn].name}</b></div><button className="quiet" aria-label="إلغاء اختيار الخلية" onClick={cancelQuestion}><X/></button></div><h2 id="huroof-question-title">{current.question.prompt}</h2><Countdown key={current.question.id} seconds={seconds} stopped={revealed}/>{revealed ? <><div className="huroof-answer" role="status"><small>الإجابة المعتمدة</small><strong>{current.question.answer}</strong><p>يقبل المقدم أي إجابة صحيحة مرتبطة بالحرف حتى لو اختلفت عن المثال.</p></div><div className="huroof-judging"><button className="correct" onClick={() => judge(true)}><Check size={19}/> إجابة صحيحة · امتلكوا الخلية</button><button className="wrong" onClick={() => judge(false)}><X size={19}/> غير صحيحة · تنتقل الفرصة</button></div></> : <button className="primary reveal-answer" onClick={() => setRevealed(true)}><Eye size={19}/> كشف الإجابة والتحكيم</button>}</div></div> : null}

      {phase === 'round-end' && roundWinner !== null ? <div className="huroof-result"><Trophy size={58}/><span className="eyebrow">اكتمل المسار</span><h2>{teams[roundWinner].name} حسموا الجولة!</h2><p>كوّنوا خطًا متصلًا بين جهتيهم. الجولة التالية تبدأ بالفريق الآخر.</p><div className="result-actions"><button className="primary" onClick={nextRound}>ابدأ الجولة التالية</button><button className="secondary" onClick={undoDecision}><Undo2 size={17}/> تصحيح التحكيم</button></div></div> : null}

      {phase === 'match-end' && matchWinner !== -1 ? <div className="huroof-result match-winner"><Trophy size={72}/><span className="eyebrow">بطل مسار الحروف</span><h2>{teams[matchWinner].name}… قدّها!</h2><p>فازوا بـ {teams[matchWinner].rounds} {teams[matchWinner].rounds === 1 ? 'جولة' : 'جولات'} ووصلوا جهتي اللوحة قبل خصمهم.</p><div className="result-summary"><span>{teams[0].rounds}<small>{teams[0].name}</small></span><span>{stats.asked}<small>سؤالًا لُعب</small></span><span>{teams[1].rounds}<small>{teams[1].name}</small></span></div><div className="result-actions"><button className="primary" onClick={restartMatch}><RotateCcw size={18}/> إعادة بنفس الإعدادات</button><button className="secondary" onClick={() => setPhase('setup')}>تعديل الإعدادات</button></div><button className="quiet undo-result" onClick={undoDecision}><Undo2 size={16}/> تصحيح آخر تحكيم</button></div> : null}
    </>}

    {rules ? <div className="exit-overlay"><div className="huroof-rules" role="dialog" aria-modal="true" aria-labelledby="huroof-rules-title"><button autoFocus className="quiet rules-close" aria-label="إغلاق طريقة اللعب" onClick={() => setRules(false)}><X/></button><span className="eyebrow"><CircleHelp size={15}/> طريقة اللعب</span><h2 id="huroof-rules-title">المسار قبل العدد</h2><ol><li><b>اختاروا خلية.</b><span>الفريق صاحب الدور يختار حرفًا يخدم مساره.</span></li><li><b>جاوبوا قبل انتهاء الوقت.</b><span>الإجابة تبدأ بالحرف أو ترتبط به كما يوضح السؤال.</span></li><li><b>المقدم يحكم.</b><span>الصحيح يملك الخلية، والخطأ يتركها متاحة وينقل الدور.</span></li><li><b>صلوا الجهتين.</b><span>الفريق الأول يمين–يسار، والثاني أعلى–أسفل، والاتصال يشمل الجهات الست للخلية.</span></li></ol><button className="primary" onClick={() => setRules(false)}>واضحة… يلا!</button></div></div> : null}
    {exit ? <div className="exit-overlay"><div role="dialog" aria-modal="true" aria-labelledby="huroof-exit"><h2 id="huroof-exit">نوقف مباراة الحروف؟</h2><p>العودة للألعاب تنهي المباراة الحالية ونتائج جولاتها.</p><button autoFocus className="primary" onClick={() => setExit(false)}>نكمل اللعب</button><button className="quiet" onClick={onHome}>إنهاء والعودة للألعاب</button></div></div> : null}
  </section>;
}
