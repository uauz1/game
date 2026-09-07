import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, Check, Eye, Flag, RotateCcw, Sparkles, Trophy, Users, X } from 'lucide-react';
import { HUROOF_LETTERS, questionsForLetter, type HuroofDifficulty, type HuroofQuestion } from '../../data/huroofQuestions';
import { findWinningPath, type CellOwner } from '../../utils/huroofPath';
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

export default function LettersGame({ onHome }: { onHome: () => void }) {
  const [teams, setTeams] = useState<Team[]>([
    { name: 'الفريق الأزرق', color: '#45b6ff', rounds: 0 },
    { name: 'الفريق الوردي', color: '#ff70b5', rounds: 0 },
  ]);
  const [seconds, setSeconds] = useState(30);
  const [difficulty, setDifficulty] = useState<HuroofDifficulty>('medium');
  const [bestOf, setBestOf] = useState(3);
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
  const [exit, setExit] = useState(false);

  const targetWins = requiredWins(bestOf);
  const matchWinner = teams.findIndex(team => team.rounds >= targetWins) as -1 | 0 | 1;
  const validNames = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();
  const boardRows = useMemo(
    () => Array.from({ length: BOARD_SIZE }, (_, row) => letters.slice(row * BOARD_SIZE, (row + 1) * BOARD_SIZE)),
    [letters],
  );
  const teamStyle = (team: Team) => ({ '--team': team.color } as CSSProperties);

  const updateTeam = (index: number, patch: Partial<Team>) => {
    setTeams(currentTeams => currentTeams.map((team, teamIndex) => teamIndex === index ? { ...team, ...patch } : team));
  };

  const startMatch = () => {
    if (!validNames) return;
    setTeams(currentTeams => currentTeams.map(team => ({ ...team, rounds: 0 })));
    setRound(1);
    setTurn(0);
    setLetters(createBoard(1));
    setOwners(Array(CELL_COUNT).fill(null));
    setUsedQuestionIds([]);
    setCurrent(null);
    setRevealed(false);
    setWinningPath([]);
    setRoundWinner(null);
    setPhase('board');
  };

  const chooseCell = (cell: number) => {
    if (phase !== 'board' || owners[cell] !== null) return;
    const letter = letters[cell];
    const pool = questionsForLetter(letter, difficulty);
    const available = pool.filter(question => !usedQuestionIds.includes(question.id));
    const candidates = available.length ? available : pool;
    const question = candidates[(round + cell + usedQuestionIds.length) % candidates.length];
    if (!question) return;
    if (!available.length) {
      const poolIds = new Set(pool.map(item => item.id));
      setUsedQuestionIds(ids => ids.filter(id => !poolIds.has(id)).concat(question.id));
    } else {
      setUsedQuestionIds(ids => [...ids, question.id]);
    }
    setCurrent({ cell, question });
    setRevealed(false);
    setPhase('question');
  };

  const judge = (correct: boolean) => {
    if (!current || !revealed || phase !== 'question') return;
    if (!correct) {
      setCurrent(null);
      setRevealed(false);
      setTurn(value => value === 0 ? 1 : 0);
      setPhase('board');
      return;
    }

    const nextOwners = [...owners];
    nextOwners[current.cell] = turn;
    const path = findWinningPath(nextOwners, BOARD_SIZE, turn);
    setOwners(nextOwners);
    setCurrent(null);
    setRevealed(false);
    if (!path.length) {
      setTurn(value => value === 0 ? 1 : 0);
      setPhase('board');
      return;
    }

    const winner = turn;
    const nextTeams = teams.map((team, index) => index === winner ? { ...team, rounds: team.rounds + 1 } : team);
    setTeams(nextTeams);
    setWinningPath(path);
    setRoundWinner(winner);
    setPhase(nextTeams[winner].rounds >= targetWins ? 'match-end' : 'round-end');
  };

  const nextRound = () => {
    const nextRoundNumber = round + 1;
    setRound(nextRoundNumber);
    setTurn((nextRoundNumber - 1) % 2 as 0 | 1);
    setLetters(createBoard(nextRoundNumber));
    setOwners(Array(CELL_COUNT).fill(null));
    setWinningPath([]);
    setRoundWinner(null);
    setPhase('board');
  };

  const restartMatch = () => {
    setTeams(currentTeams => currentTeams.map(team => ({ ...team, rounds: 0 })));
    setRound(1);
    setTurn(0);
    setLetters(createBoard(1));
    setOwners(Array(CELL_COUNT).fill(null));
    setCurrent(null);
    setRevealed(false);
    setWinningPath([]);
    setRoundWinner(null);
    setPhase('board');
  };

  const isPlaying = phase !== 'setup' && phase !== 'match-end';
  return <section className="arena huroof-arena" aria-label="لعبة حروف مع عزيز">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={16}/> حروف مع عزيز</span><h1>{phase === 'setup' ? 'اربطوا الحروف… واقطعوا الطريق.' : phase === 'match-end' ? 'المسار حسمها!' : `الجولة ${round} · ابنوا المسار`}</h1></div><button className="quiet" onClick={() => isPlaying ? setExit(true) : onHome()}>الألعاب <ArrowLeft size={17}/></button></div>

    {phase === 'setup' ? <div className="huroof-setup">
      <div className="section-heading"><h2>جهّزوا الفريقين</h2><p>الفريق الأول يصل اليمين باليسار، والثاني يصل الأعلى بالأسفل. أول مسار متصل يفوز بالجولة.</p></div>
      <div className="team-setup">{teams.map((team, index) => <div className="team-editor" key={index} style={teamStyle(team)}><div className="team-emblem"><Users size={36}/><span>0{index + 1}</span></div><label htmlFor={`huroof-team-${index}`}>اسم الفريق {index === 0 ? 'الأول' : 'الثاني'}</label><input id={`huroof-team-${index}`} aria-label={`اسم الفريق ${index + 1}`} maxLength={22} value={team.name} onChange={event => updateTeam(index, { name: event.target.value })}/><div className="color-choices" aria-label={`لون الفريق ${index + 1}`}>{TEAM_COLORS.map(color => <button type="button" key={color.value} aria-label={`${color.name} للفريق ${index + 1}`} aria-pressed={team.color === color.value} disabled={teams[1 - index].color === color.value} style={{ background: color.value }} onClick={() => updateTeam(index, { color: color.value })}>{team.color === color.value ? <Check size={17}/> : null}</button>)}</div><small>{index === 0 ? 'مساركم من اليمين إلى اليسار' : 'مساركم من الأعلى إلى الأسفل'}</small></div>)}</div>
      <div className="match-settings huroof-settings"><div><Flag/><b>إعدادات المباراة</b></div><label>مدة السؤال<select aria-label="مدة السؤال" value={seconds} onChange={event => setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>مستوى الأسئلة<select aria-label="مستوى الصعوبة" value={difficulty} onChange={event => setDifficulty(event.target.value as HuroofDifficulty)}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></label><label>نظام المباراة<select aria-label="عدد الجولات" value={bestOf} onChange={event => setBestOf(Number(event.target.value))}><option value={1}>جولة واحدة</option><option value={3}>الأفضل من 3</option><option value={5}>الأفضل من 5</option></select></label></div>
      {!validNames ? <p className="validation" role="status">اكتبوا اسمين مختلفين وغير فارغين.</p> : null}
      <div className="arena-actions"><span>الإجابة الصحيحة تملك الخلية، ثم ينتقل الدور للفريق الآخر.</span><button className="primary" disabled={!validNames} onClick={startMatch}>ابدأوا المباراة <Flag size={18}/></button></div>
      <div className="host-note"><span>✦</span><p><b>المقدم يحكم الإجابات.</b> اختاروا خلية، جاوبوا بصوت عالٍ، اكشفوا الحل، ثم سجّلوا النتيجة. السؤال لا يتكرر حتى تنتهي مجموعة الحرف.</p></div>
    </div> : <>
      <div className="huroof-scorebar">{teams.map((team, index) => <div key={index} className={`huroof-team-score ${turn === index && phase === 'board' ? 'is-turn' : ''}`} style={teamStyle(team)}><span>{team.name}</span><strong>{team.rounds}<small> / {targetWins}</small></strong><small>{index === 0 ? 'يمين ↔ يسار' : 'أعلى ↕ أسفل'}</small></div>)}<div className="huroof-round"><small>المباراة</small><b>الجولة {round}</b><span>{bestOf === 1 ? 'جولة حاسمة' : `الأفضل من ${bestOf}`}</span></div></div>

      <div className="huroof-board-shell" style={{ '--team-a': teams[0].color, '--team-b': teams[1].color } as CSSProperties}>
        <div className="path-edge edge-top"><span>{teams[1].name}</span></div><div className="path-edge edge-right"><span>{teams[0].name}</span></div>
        <div className="huroof-grid" role="grid" aria-label="شبكة الحروف">{boardRows.map((rowLetters, row) => <div className="huroof-row" role="row" key={row}>{rowLetters.map((letter, column) => { const cell = row * BOARD_SIZE + column; const owner = owners[cell]; const isPath = winningPath.includes(cell); return <button type="button" role="gridcell" key={cell} className={`huroof-cell ${owner === 0 ? 'owned-a' : owner === 1 ? 'owned-b' : ''} ${isPath ? 'winning-cell' : ''}`} disabled={owner !== null || phase !== 'board'} aria-label={`حرف ${letter}${owner !== null ? `، ملك ${teams[owner].name}` : ''}`} onClick={() => chooseCell(cell)}><span>{letter}</span>{owner !== null ? <Check aria-hidden="true" size={14}/> : null}</button>; })}</div>)}</div>
        <div className="path-edge edge-left"><span>{teams[0].name}</span></div><div className="path-edge edge-bottom"><span>{teams[1].name}</span></div>
      </div>

      {phase === 'board' ? <div className="huroof-turn" role="status"><span style={{ background: teams[turn].color }}/><p><b>الدور على {teams[turn].name}</b> — اختاروا خلية تساعدكم تكملون المسار أو تقطعون طريق الخصم.</p></div> : null}

      {phase === 'question' && current ? <div className="huroof-question-overlay"><div className="huroof-question" role="dialog" aria-modal="true" aria-labelledby="huroof-question-title"><div className="huroof-question-head"><span className="letter-big">{letters[current.cell]}</span><div><small>سؤال {difficulty === 'easy' ? 'سهل' : difficulty === 'medium' ? 'متوسط' : 'صعب'}</small><b>{teams[turn].name}</b></div><button className="quiet" aria-label="إلغاء اختيار الخلية" onClick={() => { setCurrent(null); setPhase('board'); }}><X/></button></div><h2 id="huroof-question-title">{current.question.prompt}</h2><Countdown key={current.question.id} seconds={seconds} stopped={revealed}/>{revealed ? <><div className="huroof-answer" role="status"><small>الإجابة المعتمدة</small><strong>{current.question.answer}</strong><p>يقبل المقدم أي إجابة صحيحة مرتبطة بالحرف حتى لو اختلفت عن المثال.</p></div><div className="huroof-judging"><button className="correct" onClick={() => judge(true)}><Check size={19}/> إجابة صحيحة · امتلكوا الخلية</button><button className="wrong" onClick={() => judge(false)}><X size={19}/> غير صحيحة · تنتقل الفرصة</button></div></> : <button className="primary reveal-answer" onClick={() => setRevealed(true)}><Eye size={19}/> كشف الإجابة والتحكيم</button>}</div></div> : null}

      {phase === 'round-end' && roundWinner !== null ? <div className="huroof-result"><Trophy size={58}/><span className="eyebrow">اكتمل المسار</span><h2>{teams[roundWinner].name} حسموا الجولة!</h2><p>كوّنوا خطًا متصلًا بين جهتيهم. الجولة التالية تبدأ بالفريق الآخر.</p><div className="result-actions"><button className="primary" onClick={nextRound}>ابدأ الجولة التالية</button><button className="secondary" onClick={() => setExit(true)}>إنهاء المباراة</button></div></div> : null}

      {phase === 'match-end' && matchWinner !== -1 ? <div className="huroof-result match-winner"><Trophy size={72}/><span className="eyebrow">بطل مسار الحروف</span><h2>{teams[matchWinner].name}… قدّها!</h2><p>فازوا بـ {teams[matchWinner].rounds} {teams[matchWinner].rounds === 1 ? 'جولة' : 'جولات'} ووصلوا جهتي اللوحة قبل خصمهم.</p><div className="result-summary"><span>{teams[0].rounds}<small>{teams[0].name}</small></span><span>{teams[1].rounds}<small>{teams[1].name}</small></span></div><div className="result-actions"><button className="primary" onClick={restartMatch}><RotateCcw size={18}/> إعادة بنفس الإعدادات</button><button className="secondary" onClick={() => setPhase('setup')}>تعديل الإعدادات</button></div></div> : null}
    </>}

    {exit ? <div className="exit-overlay"><div role="dialog" aria-modal="true" aria-labelledby="huroof-exit"><h2 id="huroof-exit">نوقف مباراة الحروف؟</h2><p>العودة للألعاب تنهي المباراة الحالية ونتائج جولاتها.</p><button autoFocus className="primary" onClick={() => setExit(false)}>نكمل اللعب</button><button className="quiet" onClick={onHome}>إنهاء والعودة للألعاب</button></div></div> : null}
  </section>;
}
