import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowLeft, Check, Flag, Send, Sparkles, Trophy, Users, X } from 'lucide-react';
import { familyRounds, type FamilyRound } from '../../data/familyFeudRounds';
import { loadHuroofPreferences } from '../../utils/huroofStorage';
import { drawWithoutRepeats } from '../../utils/newGameRotation';
import { useNewGameNumber } from '../../utils/newGameSettings';
import { loadSharedTeams, saveSharedTeams } from '../../utils/sharedTeams';
import Countdown from './Countdown';
import { HostPairingPanel, useFamilyHostRoom, type FamilyHostCommand, type FamilyHostState } from './HostRoom';

type Team = { name: string; color: string; score: number };
type Phase = 'setup' | 'play' | 'result';
const colors = ['#45b6ff', '#ff70b5', '#a77bff', '#ffd45a'];

function normalize(value: string) {
  return value.trim().toLowerCase().normalize('NFD')
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ـ/g, '')
    .replace(/[^\u0621-\u063a\u0641-\u064a0-9]/g, '').replace(/^ال/, '');
}

function initialTeams(): Team[] {
  const shared = loadSharedTeams();
  if (shared) return shared.map(team => ({ ...team, score: 0 }));
  const saved = loadHuroofPreferences();
  return [
    { name: saved.teamNames[0], color: saved.teamColors[0], score: 0 },
    { name: saved.teamNames[1], color: saved.teamColors[1], score: 0 },
  ];
}

function answerMatches(expected: string, submitted: string) {
  const a = normalize(expected);
  const b = normalize(submitted);
  if (!a || !b) return false;
  if (a === b) return true;
  return Math.min(a.length, b.length) >= 5 && (a.includes(b) || b.includes(a));
}

export default function FamilyFeudPro({ onHome }: { onHome: () => void }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [seconds, setSeconds] = useNewGameNumber('family', 'seconds', 60);
  const [rounds, setRounds] = useNewGameNumber('family', 'rounds', 6);
  const [deck, setDeck] = useState<FamilyRound[]>(familyRounds);
  const [round, setRound] = useState(0);
  const [active, setActive] = useState(0);
  const [roundOwner, setRoundOwner] = useState(0);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [strikes, setStrikes] = useState(0);
  const [stealMode, setStealMode] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [phase, setPhase] = useState<Phase>('setup');
  const [hostFeedback, setHostFeedback] = useState<FamilyHostState['feedback']>(null);
  const [screenAnswer, setScreenAnswer] = useState('');

  const current = deck[round] ?? familyRounds[0];
  const availableRounds = deck.length;
  const roundScore = useMemo(() => revealed.reduce((sum, index) => sum + Number(current.answers[index]?.[1] || 0), 0), [current, revealed]);
  const validNames = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();
  const winner = teams[0].score === teams[1].score ? null : teams[0].score > teams[1].score ? 0 : 1;

  const nextRound = () => {
    if (round + 1 >= availableRounds) { setPhase('result'); return; }
    const next = round + 1;
    const starter = next % 2;
    setRound(next);
    setActive(starter);
    setRoundOwner(starter);
    setRevealed([]);
    setStrikes(0);
    setStealMode(false);
    setTimedOut(false);
    setHostFeedback(null);
    setScreenAnswer('');
  };

  const start = () => {
    if (!validNames) return;
    const selected = drawWithoutRepeats('family-pro', familyRounds, rounds, item => item.id);
    if (!selected.length) return;
    const prepared = teams.map(team => ({ ...team, name: team.name.trim(), score: 0 }));
    saveSharedTeams(prepared);
    setTeams(prepared);
    setDeck(selected);
    setRound(0);
    setActive(0);
    setRoundOwner(0);
    setRevealed([]);
    setStrikes(0);
    setStealMode(false);
    setTimedOut(false);
    setHostFeedback(null);
    setScreenAnswer('');
    setPhase('play');
  };

  const awardRound = (teamIndex = active) => {
    if (!revealed.length && !timedOut) return;
    const points = roundScore;
    setTeams(value => value.map((team, index) => index === teamIndex ? { ...team, score: team.score + points } : team));
    setHostFeedback({ kind:'correct', text: points ? `${teams[teamIndex].name} أخذ ${points} نقطة من الجولة` : 'انتهت الجولة بلا نقاط' });
    nextRound();
  };

  const addStrike = () => {
    if (timedOut) return;
    if (stealMode) {
      setHostFeedback({ kind:'wrong', text:`فشلت محاولة الخطف · البنك يعود إلى ${teams[roundOwner].name}` });
      awardRound(roundOwner);
      return;
    }
    setStrikes(value => {
      const next = Math.min(3, value + 1);
      if (next === 3 && value < 3) {
        const stealingTeam = 1 - roundOwner;
        setActive(stealingTeam);
        setStealMode(true);
        setHostFeedback({ kind:'info', text:`ثلاث ضربات · فرصة خطف واحدة لـ ${teams[stealingTeam].name}` });
      } else setHostFeedback({ kind:'wrong', text:`ضربة ${next} من 3` });
      return next;
    });
  };

  const submitAnswer = (raw: string) => {
    if (timedOut || phase !== 'play') return;
    const submitted = raw.trim();
    if (!submitted) return;
    const match = current.answers.findIndex(([answer]) => answerMatches(answer, submitted));
    if (match < 0) { addStrike(); return; }
    if (revealed.includes(match)) {
      setHostFeedback({ kind:'info', text:`«${current.answers[match][0]}» مكشوفة من قبل` });
      return;
    }
    const nextRevealed = [...revealed, match];
    setRevealed(nextRevealed);
    const answerPoints = current.answers[match][1];
    if (stealMode) {
      const stolenBank = roundScore + answerPoints;
      setTeams(value => value.map((team, index) => index === active ? { ...team, score: team.score + stolenBank } : team));
      setHostFeedback({ kind:'correct', text:`خطف ناجح · ${teams[active].name} أخذ ${stolenBank} نقطة` });
      window.setTimeout(nextRound, 650);
      return;
    }
    setHostFeedback({ kind:'correct', text:`إجابة على اللوحة: ${current.answers[match][0]} · ${answerPoints} نقطة` });
    if (nextRevealed.length === current.answers.length) {
      const total = current.answers.reduce((sum, [,points]) => sum + points, 0);
      setTeams(value => value.map((team, index) => index === active ? { ...team, score: team.score + total } : team));
      window.setTimeout(nextRound, 650);
    }
  };

  const switchTeam = () => {
    if (timedOut || stealMode) return;
    setActive(team => 1 - team);
    setHostFeedback({ kind:'info', text:'تم تحويل الدور للفريق الآخر' });
  };

  const handleHostCommand = (command: FamilyHostCommand) => {
    if (phase !== 'play') return;
    if (command.type === 'submit-answer') { submitAnswer(command.answer); return; }
    if (command.type === 'strike') { addStrike(); return; }
    if (command.type === 'switch-team') { switchTeam(); return; }
    if (command.type === 'award-round') awardRound(active);
  };

  const hostState: FamilyHostState = {
    type:'family-state', phase, round, totalRounds:availableRounds,
    question: phase === 'play' ? current.question : '',
    answers: current.answers.map(([answer,points],index) => ({ answer, points:Number(points), revealed:revealed.includes(index) })),
    teams, active, strikes, roundScore, timedOut, feedback:hostFeedback,
  };
  const hostRoom = useFamilyHostRoom(hostState, handleHostCommand);

  const submitFromScreen = (event: FormEvent) => {
    event.preventDefault();
    if (!screenAnswer.trim()) return;
    submitAnswer(screenAnswer);
    setScreenAnswer('');
  };

  return <section className="arena new-game feud-game" dir="rtl">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={15}/> تحدي العائلة</span><h1>{phase==='setup'?'الإجابات الشائعة تكسب.':phase==='result'?'اكتملت المواجهة!':`الجولة ${round+1} · ${teams[active].name}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>

    {phase === 'setup' ? <div className="new-game-setup"><div className="section-heading"><h2>جهّزوا الفريقين والمقدم</h2><p>32 جولة أصلية متنوعة، ومستوى متوسط إلى صعب. النقاط أوزان لعب لإجابات شائعة وليست نتيجة استطلاع علمي.</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor compact-team" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users/><span>0{index+1}</span></div><label htmlFor={`family-team-${index}`}>اسم الفريق {index===0?'الأول':'الثاني'}</label><input id={`family-team-${index}`} maxLength={22} value={team.name} onChange={event=>setTeams(current=>current.map((item,i)=>i===index?{...item,name:event.target.value}:item))}/><div className="color-choices">{colors.map(color=><button key={color} aria-label={`اختيار لون ${color}`} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>setTeams(current=>current.map((item,i)=>i===index?{...item,color}:item))}>{team.color===color?<Check size={16}/>:null}</button>)}</div></div>)}</div><div className="match-settings new-game-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة الجولة<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>عدد الجولات<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={4}>4 جولات</option><option value={6}>6 جولات</option><option value={8}>8 جولات</option></select></label></div><HostPairingPanel status={hostRoom.status} hostUrl={hostRoom.hostUrl} qrCode={hostRoom.qrCode}/>{!validNames?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:null}<div className="arena-actions"><span>QR للمقدم اختياري؛ لو ما ربطته تقدر تتحكم من الشاشة الكبيرة.</span><button className="primary" disabled={!validNames} onClick={start}>ابدأوا تحدي العائلة <Flag size={18}/></button></div></div> : null}

    {phase === 'play' ? <><HostPairingPanel status={hostRoom.status} hostUrl={hostRoom.hostUrl} qrCode={hostRoom.qrCode} compact/><div className="new-scorebar">{teams.map((team,index)=><div key={team.name} className={active===index?'active':''} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong></div>)}<p>الجولة <b>{round+1}</b> / {availableRounds}</p></div><div className="new-stage feud-stage"><div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}><span className="game-chip">{current.category}</span><span className="game-chip">{current.difficulty==='hard'?'صعب':'متوسط'}</span>{stealMode?<span className="game-chip">فرصة خطف</span>:null}</div><h2>{current.question}</h2><Countdown key={current.id} seconds={seconds} stopped={timedOut || revealed.length===current.answers.length} onExpire={()=>{setTimedOut(true);setHostFeedback({kind:'info',text:'انتهى الوقت · القرار للمقدم'});}}/><div className="strike-row">{[0,1,2].map(index=><span key={index} className={index<strikes?'on':''}>✕</span>)}</div><div className="feud-board">{current.answers.map(([answer,points],index)=>{const visible=timedOut||revealed.includes(index);return <button key={answer} disabled={timedOut||visible} className={visible?'revealed':''} onClick={()=>{if(!visible)submitAnswer(answer);}}><span>{index+1}</span><b>{visible?answer:'••••••'}</b><strong>{visible?points:'?'}</strong></button>})}</div><form onSubmit={submitFromScreen} className="connection-answer" style={{marginTop:16}}><label htmlFor="family-screen-answer">إجابة {teams[active].name}{stealMode?' · محاولة الخطف':''}</label><div><input id="family-screen-answer" autoComplete="off" maxLength={80} disabled={timedOut} value={screenAnswer} onChange={event=>setScreenAnswer(event.target.value)} placeholder="اكتب الإجابة…"/><button type="submit" className="primary" disabled={!screenAnswer.trim()||timedOut}><Send/> تحقق</button></div></form>{hostFeedback?<p className={`host-feedback ${hostFeedback.kind}`} role="status">{hostFeedback.kind==='correct'?<Check/>:hostFeedback.kind==='wrong'?<X/>:<Users/>}{hostFeedback.text}</p>:null}<div className="feud-controls"><button className="wrong" disabled={timedOut} onClick={addStrike}><X/> خطأ / ضربة</button><button className="secondary" disabled={timedOut||stealMode} onClick={switchTeam}>تحويل الدور</button><button className="primary" disabled={!revealed.length&&!timedOut} onClick={()=>awardRound(active)}>{roundScore?`منح ${roundScore} نقطة وإنهاء الجولة`:'إنهاء الجولة بلا نقاط'}</button></div></div></> : null}

    {phase === 'result' ? <div className="new-result"><Trophy/><span className="eyebrow">أبطال تحدي العائلة</span><h2>{winner===null?'تعادل… كلكم قدّها!':`${teams[winner].name}… قدّها!`}</h2><div className="new-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><b>{team.name}</b><strong>{team.score}</strong></span>)}</div><div className="result-actions"><button className="primary" onClick={start}>إعادة بنفس الإعدادات</button><button className="secondary" onClick={()=>setPhase('setup')}>تعديل الإعدادات</button></div></div> : null}
  </section>;
}
