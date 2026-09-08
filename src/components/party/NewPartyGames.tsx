import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Check, Eye, FastForward, Flag, Image, Lightbulb, Link2, RotateCcw, Send, Sparkles, Trophy, Users, X, Zap } from 'lucide-react';
import { loadHuroofPreferences } from '../../utils/huroofStorage';
import { characterCards, connectionCards, feudRounds, photoCards, riddles, speedQuestions, wordCards } from '../../data/newPartyGames';
import { drawWithoutRepeats } from '../../utils/newGameRotation';
import { useNewGameNumber } from '../../utils/newGameSettings';
import { loadSharedTeams, saveSharedTeams } from '../../utils/sharedTeams';
import Countdown from './Countdown';
import { HostPairingPanel, useFamilyHostRoom, type FamilyHostCommand, type FamilyHostState } from './HostRoom';

type Team = { name: string; color: string; score: number };
type GameProps = { onHome: () => void };
const colors = ['#45b6ff', '#ff70b5', '#a77bff', '#ffd45a'];

function normalizeFamilyAnswer(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u064b-\u065f\u0670]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ـ/g, '').replace(/[^\u0621-\u063a\u0641-\u064a0-9]/g, '').replace(/^ال/, '');
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

function prepareTeams(teams: Team[]) {
  const prepared = teams.map(team => ({ ...team, name: team.name.trim(), score: 0 }));
  saveSharedTeams(prepared);
  return prepared;
}

function GameHeader({ eyebrow, title, onHome }: { eyebrow: string; title: string; onHome: () => void }) {
  return <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={15}/> {eyebrow}</span><h1>{title}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>;
}

function TeamSetup({ teams, setTeams, seconds, setSeconds, rounds, setRounds, onStart, children, description }: {
  teams: Team[]; setTeams: (teams: Team[]) => void; seconds: number; setSeconds: (value: number) => void;
  rounds: number; setRounds: (value: number) => void; onStart: () => void; children?: ReactNode; description?: string;
}) {
  const valid = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();
  const update = (index: number, patch: Partial<Team>) => setTeams(teams.map((team, teamIndex) => teamIndex === index ? { ...team, ...patch } : team));
  return <div className="new-game-setup"><div className="section-heading"><h2>جهّزوا الفريقين</h2><p>{description ?? 'اختاروا الأسماء والإعدادات، والمقدم يتولى التحكيم على شاشة واحدة.'}</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor compact-team" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users/><span>0{index+1}</span></div><label htmlFor={`new-team-${index}`}>اسم الفريق {index===0?'الأول':'الثاني'}</label><input id={`new-team-${index}`} maxLength={22} value={team.name} onChange={event=>update(index,{name:event.target.value})}/><div className="color-choices">{colors.map(color=><button key={color} aria-label={`اختيار لون ${color}`} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>update(index,{color})}>{team.color===color?<Check size={16}/>:null}</button>)}</div></div>)}</div><div className="match-settings new-game-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة الجولة<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>عدد الجولات<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={4}>4 جولات</option><option value={6}>6 جولات</option><option value={8}>8 جولات</option></select></label>{children}</div>{!valid?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:null}<div className="arena-actions"><span>كل لعبة تحفظ روح قدّها: سريعة، واضحة، وتنافسية.</span><button className="primary" disabled={!valid} onClick={onStart}>ابدأوا التحدّي <Flag size={18}/></button></div></div>;
}

function Scorebar({ teams, turn, round, total }: { teams: Team[]; turn: number; round: number; total: number }) {
  return <div className="new-scorebar">{teams.map((team,index)=><div key={index} className={turn===index?'active':''} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong></div>)}<p>الجولة <b>{Math.min(round+1,total)}</b> / {total}</p></div>;
}

export function CharacterGuessGame({ onHome }: GameProps) {
  const [teams,setTeams]=useState(initialTeams); const [seconds,setSeconds]=useNewGameNumber('character','seconds',30); const [rounds,setRounds]=useNewGameNumber('character','rounds',6);
  const [deck,setDeck]=useState(characterCards); const [round,setRound]=useState(0); const [hint,setHint]=useState(1); const [choice,setChoice]=useState(''); const [phase,setPhase]=useState<'setup'|'play'|'result'>('setup');
  const card=deck[round]; const turn=round%2; const start=()=>{setDeck(drawWithoutRepeats('characters',characterCards,rounds,item=>item.id));setTeams(prepareTeams(teams));setRound(0);setHint(1);setChoice('');setPhase('play');};
  const choose=(answer:string)=>{if(choice)return;setChoice(answer);if(answer===card.answer)setTeams(value=>value.map((team,index)=>index===turn?{...team,score:team.score+(4-hint)*100}:team));};
  const next=()=>{if(round+1>=deck.length){setPhase('result');return;}setRound(round+1);setHint(1);setChoice('');};
  return <section className="arena new-game character-game"><GameHeader eyebrow="خمن الشخصية" title={phase==='setup'?'التلميح الذكي يكسب.':phase==='result'?'انكشفت الشخصيات!':`شخصية ${round+1} من ${deck.length}`} onHome={onHome}/>{phase==='setup'?<TeamSetup {...{teams,setTeams,seconds,setSeconds,rounds,setRounds}} onStart={start}/>:phase==='result'?<GameResult title="أبطال التخمين" teams={teams} onReplay={start} onSetup={()=>setPhase('setup')}/>:<><Scorebar teams={teams} turn={turn} round={round} total={deck.length}/><div className="new-stage"><span className="game-chip">{card.category}</span><div className="character-silhouette">?</div><div className="progressive-hints">{card.hints.slice(0,hint).map((text,index)=><p key={text}><b>{index+1}</b>{text}</p>)}</div><Countdown key={card.answer} seconds={seconds} stopped={Boolean(choice)} onExpire={()=>setChoice('__timeout__')}/>{!choice?<><div className="choice-grid">{card.options.map(option=><button key={option} onClick={()=>choose(option)}>{option}</button>)}</div><button className="quiet centered" disabled={hint===card.hints.length} onClick={()=>setHint(Math.min(card.hints.length,hint+1))}><Lightbulb size={17}/> تلميح إضافي · نقاط أقل</button></>:<div className={`answer-feedback ${choice===card.answer?'correct':'wrong'}`}><h2>{choice===card.answer?'إجابة صحيحة!':choice==='__timeout__'?'انتهى الوقت!':'مو هي…'}</h2><p>الإجابة: <b>{card.answer}</b></p><button className="primary" onClick={next}>{round+1===deck.length?'عرض النتيجة':'الشخصية التالية'}</button></div>}</div></>}</section>;
}

export function RiddlesGame({ onHome }: GameProps) {
  const [teams,setTeams]=useState(initialTeams); const [seconds,setSeconds]=useNewGameNumber('riddles','seconds',30); const [rounds,setRounds]=useNewGameNumber('riddles','rounds',6); const [deck,setDeck]=useState(riddles); const [round,setRound]=useState(0); const [revealed,setRevealed]=useState(false); const [timedOut,setTimedOut]=useState(false); const [phase,setPhase]=useState<'setup'|'play'|'result'>('setup');
  const start=()=>{setDeck(drawWithoutRepeats('riddles',riddles,rounds,item=>item[0]));setTeams(prepareTeams(teams));setRound(0);setRevealed(false);setTimedOut(false);setPhase('play');};
  const award=(team:number|null)=>{if(team!==null&&!timedOut)setTeams(value=>value.map((item,index)=>index===team?{...item,score:item.score+100}:item));if(round+1>=deck.length)setPhase('result');else{setRound(round+1);setRevealed(false);setTimedOut(false);}};
  return <section className="arena new-game riddle-game"><GameHeader eyebrow="فوازير" title={phase==='setup'?'فكّوها قبل ما يفوت الوقت.':phase==='result'?'العقول حسمتها!':`الفزورة ${round+1} من ${deck.length}`} onHome={onHome}/>{phase==='setup'?<TeamSetup {...{teams,setTeams,seconds,setSeconds,rounds,setRounds}} onStart={start}/>:phase==='result'?<GameResult title="أذكى فريق" teams={teams} onReplay={start} onSetup={()=>setPhase('setup')}/>:<><Scorebar teams={teams} turn={round%2} round={round} total={deck.length}/><div className="new-stage riddle-stage"><span className="riddle-mark">؟</span><h2>{deck[round][0]}</h2><Countdown key={deck[round][0]} seconds={seconds} stopped={revealed} onExpire={()=>{setTimedOut(true);setRevealed(true);}}/>{!revealed?<button className="primary" onClick={()=>setRevealed(true)}><Eye/> كشف الحل</button>:<div className={`answer-feedback ${timedOut?'wrong':'correct'}`}><small>{timedOut?'انتهى الوقت · بلا نقاط':'الحل'}</small><h2>{deck[round][1]}</h2><div className="judge-row">{timedOut?<button className="primary" onClick={()=>award(null)}>{round+1===deck.length?'عرض النتيجة':'الفزورة التالية'}</button>:<>{teams.map((team,index)=><button key={team.name} style={{'--team':team.color} as CSSProperties} onClick={()=>award(index)}>+100 · {team.name}</button>)}<button onClick={()=>award(null)}>لا أحد</button></>}</div></div>}</div></>}</section>;
}

export function PhotoChallengeGame({ onHome }: GameProps) {
  const [teams,setTeams]=useState(initialTeams); const [seconds,setSeconds]=useNewGameNumber('photo','seconds',30); const [rounds,setRounds]=useNewGameNumber('photo','rounds',6); const [deck,setDeck]=useState(photoCards); const [round,setRound]=useState(0); const [level,setLevel]=useState(0); const [revealed,setRevealed]=useState(false); const [timedOut,setTimedOut]=useState(false); const [phase,setPhase]=useState<'setup'|'play'|'result'>('setup');
  const start=()=>{setDeck(drawWithoutRepeats('photos',photoCards,rounds,item=>item.id));setTeams(prepareTeams(teams));setRound(0);setLevel(0);setRevealed(false);setTimedOut(false);setPhase('play');};
  const award=(team:number|null)=>{if(team!==null&&!timedOut)setTeams(value=>value.map((item,index)=>index===team?{...item,score:item.score+(3-level)*100}:item));if(round+1>=deck.length)setPhase('result');else{setRound(round+1);setLevel(0);setRevealed(false);setTimedOut(false);}};
  const card=deck[round];
  return <section className="arena new-game photo-game"><GameHeader eyebrow="تحدي الصورة" title={phase==='setup'?'التفاصيل الصغيرة تفضحها.':phase==='result'?'وضحت الصورة!':`الصورة ${round+1} من ${deck.length}`} onHome={onHome}/>{phase==='setup'?<TeamSetup {...{teams,setTeams,seconds,setSeconds,rounds,setRounds}} onStart={start}/>:phase==='result'?<GameResult title="أقوى ملاحظة" teams={teams} onReplay={start} onSetup={()=>setPhase('setup')}/>:<><Scorebar teams={teams} turn={round%2} round={round} total={deck.length}/><div className="new-stage photo-stage"><span className="game-chip">{card.category}</span><div className={`photo-visual reveal-${revealed?2:level}`} style={{'--photo-tone':card.tone,'--photo-position':card.position} as CSSProperties}><span role="img" aria-label={`صورة ${card.category}`}/></div><p className="photo-points">قيمة الإجابة: <b>{timedOut?0:(3-level)*100}</b> نقطة</p><Countdown key={card.answer} seconds={seconds} stopped={revealed} onExpire={()=>{setTimedOut(true);setRevealed(true);}}/>{!revealed?<div className="photo-actions"><button className="secondary" disabled={level===2} onClick={()=>setLevel(Math.min(2,level+1))}><Image/> وضّح أكثر</button><button className="primary" onClick={()=>setRevealed(true)}><Eye/> كشف الصورة</button></div>:<div className={`answer-feedback ${timedOut?'wrong':'correct'}`}><small>{timedOut?'انتهى الوقت · بلا نقاط':'الإجابة'}</small><h2>{card.answer}</h2><div className="judge-row">{timedOut?<button className="primary" onClick={()=>award(null)}>{round+1===deck.length?'عرض النتيجة':'الصورة التالية'}</button>:<>{teams.map((team,index)=><button key={team.name} style={{'--team':team.color} as CSSProperties} onClick={()=>award(index)}>{team.name} · +{(3-level)*100}</button>)}<button onClick={()=>award(null)}>لا أحد</button></>}</div></div>}</div></>}</section>;
}

export function FastestGame({ onHome }: GameProps) {
  const [teams,setTeams]=useState(initialTeams); const [seconds,setSeconds]=useNewGameNumber('fast','seconds',20); const [rounds,setRounds]=useNewGameNumber('fast','rounds',6); const [deck,setDeck]=useState(speedQuestions); const [round,setRound]=useState(0); const [buzz,setBuzz]=useState<number|null>(null); const [revealed,setRevealed]=useState(false); const [expired,setExpired]=useState(false); const [phase,setPhase]=useState<'setup'|'play'|'result'>('setup');
  const start=()=>{setDeck(drawWithoutRepeats('speed',speedQuestions,rounds,item=>item[0]));setTeams(prepareTeams(teams));setRound(0);setBuzz(null);setRevealed(false);setExpired(false);setPhase('play');};
  const buzzer=(index:number)=>{if(buzz!==null)return;setBuzz(index);try{navigator.vibrate?.(35);}catch{/* Haptics are optional. */}};
  const judge=(correct:boolean)=>{if(buzz===null)return;if(correct){setTeams(value=>value.map((team,index)=>index===buzz?{...team,score:team.score+100}:team));next();}else{setBuzz(1-buzz);setRevealed(false);}};
  const next=()=>{if(round+1>=deck.length)setPhase('result');else{setRound(round+1);setBuzz(null);setRevealed(false);setExpired(false);}};
  return <section className="arena new-game fastest-game"><GameHeader eyebrow="مين أسرع؟" title={phase==='setup'?'الزر يحسم أول محاولة.':phase==='result'?'السرعة تكلمت!':`سؤال السرعة ${round+1}`} onHome={onHome}/>{phase==='setup'?<TeamSetup {...{teams,setTeams,seconds,setSeconds,rounds,setRounds}} onStart={start}/>:phase==='result'?<GameResult title="أسرع فريق" teams={teams} onReplay={start} onSetup={()=>setPhase('setup')}/>:<><Scorebar teams={teams} turn={buzz??round%2} round={round} total={deck.length}/><div className="new-stage speed-stage"><Zap className="speed-icon"/><h2>{deck[round][0]}</h2><Countdown key={deck[round][0]} seconds={seconds} stopped={buzz!==null||expired} onExpire={()=>setExpired(true)}/>{expired?<div className="answer-feedback wrong" role="status"><h3>انتهى الوقت بلا ضغطة</h3><p>الإجابة: <b>{deck[round][1]}</b></p><button className="primary" onClick={next}>{round+1===deck.length?'عرض النتيجة':'السؤال التالي'}</button></div>:buzz===null?<div className="buzzers">{teams.map((team,index)=><button key={team.name} style={{'--team':team.color} as CSSProperties} onClick={()=>buzzer(index)}><Zap/> زر {team.name}<small>{index===0?'يمين':'يسار'}</small></button>)}</div>:<div className="buzz-lock" style={{'--team':teams[buzz].color} as CSSProperties}><h3>{teams[buzz].name} ضغطوا أول!</h3>{!revealed?<button className="primary" onClick={()=>setRevealed(true)}><Eye/> كشف الإجابة</button>:<><p>الإجابة: <b>{deck[round][1]}</b></p><div className="judge-row"><button onClick={()=>judge(true)}><Check/> صحيحة +100</button><button onClick={()=>judge(false)}><X/> خطأ · فرصة للخصم</button><button onClick={next}>لا أحد</button></div></>}</div>}</div></>}</section>;
}

export function WordBankGame({ onHome }: GameProps) {
  const [teams,setTeams]=useState(initialTeams); const [seconds,setSeconds]=useNewGameNumber('words','seconds',45); const [rounds,setRounds]=useNewGameNumber('words','rounds',8); const [deck,setDeck]=useState(wordCards); const [round,setRound]=useState(0); const [showWord,setShowWord]=useState(false); const [timedOut,setTimedOut]=useState(false); const [phase,setPhase]=useState<'setup'|'play'|'result'>('setup');
  const start=()=>{setDeck(drawWithoutRepeats('words',wordCards,rounds,item=>item.id));setTeams(prepareTeams(teams));setRound(0);setShowWord(false);setTimedOut(false);setPhase('play');};
  const next=(correct:boolean)=>{if(correct&&!timedOut)setTeams(value=>value.map((team,index)=>index===round%2?{...team,score:team.score+100}:team));if(round+1>=deck.length)setPhase('result');else{setRound(round+1);setShowWord(false);setTimedOut(false);}};
  const card=deck[round];
  return <section className="arena new-game word-game"><GameHeader eyebrow="بنك الكلمات" title={phase==='setup'?'وصف ذكي… بلا الكلمات الممنوعة.':phase==='result'?'خلص رصيد الكلمات!':`دور ${teams[round%2].name}`} onHome={onHome}/>{phase==='setup'?<TeamSetup {...{teams,setTeams,seconds,setSeconds,rounds,setRounds}} onStart={start}/>:phase==='result'?<GameResult title="أبطال الوصف" teams={teams} onReplay={start} onSetup={()=>setPhase('setup')}/>:<><Scorebar teams={teams} turn={round%2} round={round} total={deck.length}/><div className="new-stage word-stage">{!showWord?<><div className="word-vault">◆</div><h2>المُوصّف من {teams[round%2].name} جاهز؟</h2><p>خلّ الباقين يبعدون نظرهم، ثم اعرض الكلمة وابدأ الوصف.</p><button className="primary" onClick={()=>setShowWord(true)}>اعرض الكلمة وابدأ</button></>:<><span className="game-chip">{card.category}</span><h2 className="target-word">{card.word}</h2><p>ممنوع تقول:</p><div className="taboo-list">{card.taboo.map(word=><b key={word}>{word}</b>)}</div><Countdown key={card.word} seconds={seconds} stopped={timedOut} onExpire={()=>setTimedOut(true)}/>{timedOut?<div className="answer-feedback wrong" role="status"><b>انتهى الوقت · بلا نقاط</b><button className="primary" onClick={()=>next(false)}>{round+1===deck.length?'عرض النتيجة':'الكلمة التالية'}</button></div>:<div className="word-actions"><button className="correct" onClick={()=>next(true)}><Check/> صح · +100</button><button className="wrong" onClick={()=>next(false)}><FastForward/> تخطّي</button></div>}</>}</div></>}</section>;
}

export function ConnectionGame({ onHome }: GameProps) {
  const [teams,setTeams]=useState(initialTeams);
  const [seconds,setSeconds]=useNewGameNumber('connection','seconds',45);
  const [rounds,setRounds]=useNewGameNumber('connection','rounds',6);
  const [deck,setDeck]=useState(connectionCards);
  const [round,setRound]=useState(0);
  const [active,setActive]=useState(0);
  const [clueCount,setClueCount]=useState(1);
  const [answer,setAnswer]=useState('');
  const [revealed,setRevealed]=useState(false);
  const [timedOut,setTimedOut]=useState(false);
  const [notice,setNotice]=useState('');
  const [phase,setPhase]=useState<'setup'|'play'|'result'>('setup');
  const card=deck[round];
  const points=[400,300,200,100][clueCount-1];

  const resetRound=(nextRound:number)=>{
    setRound(nextRound);
    setActive(nextRound%2);
    setClueCount(1);
    setAnswer('');
    setRevealed(false);
    setTimedOut(false);
    setNotice('');
  };
  const start=()=>{
    setDeck(drawWithoutRepeats('connection',connectionCards,rounds,item=>item.id));
    setTeams(prepareTeams(teams));
    resetRound(0);
    setPhase('play');
  };
  const next=()=>{
    if(round+1>=deck.length)setPhase('result');
    else resetRound(round+1);
  };
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    const submitted=normalizeFamilyAnswer(answer);
    if(!submitted){setNotice('اكتبوا الرابط أولًا.');return;}
    const accepted=[card.answer,...card.aliases].map(normalizeFamilyAnswer);
    const correct=accepted.some(expected=>expected===submitted||(Math.min(expected.length,submitted.length)>=5&&(expected.includes(submitted)||submitted.includes(expected))));
    if(correct){
      setTeams(value=>value.map((team,index)=>index===active?{...team,score:team.score+points}:team));
      setNotice(`إجابة صحيحة · +${points} نقطة`);
      setRevealed(true);
      return;
    }
    if(clueCount===4){setNotice('انتهت المحاولات · بلا نقاط');setRevealed(true);return;}
    setClueCount(value=>value+1);
    setActive(value=>1-value);
    setAnswer('');
    setNotice('مو الرابط… انفتح تلميح جديد وانتقل الدور.');
  };
  const giveUp=()=>{setNotice('تم كشف الرابط · بلا نقاط');setRevealed(true);};

  return <section className="arena new-game connection-game"><GameHeader eyebrow="وش الرابط؟" title={phase==='setup'?'أربع إشارات… رابط واحد.':phase==='result'?'انربطت الخيوط!':`الرابط ${round+1} من ${deck.length}`} onHome={onHome}/>{phase==='setup'?<TeamSetup {...{teams,setTeams,seconds,setSeconds,rounds,setRounds}} description="اختاروا الأسماء، والنظام يتحقق من الرابط ويحسب النقاط تلقائيًا." onStart={start}><small className="auto-save-note">36 رابطًا متنوعًا؛ التلميح الأول يساوي 400 نقطة وتنخفض القيمة مع كل تلميح.</small></TeamSetup>:phase==='result'?<GameResult title="أسرع من ربطها" teams={teams} onReplay={start} onSetup={()=>setPhase('setup')}/>:<><Scorebar teams={teams} turn={active} round={round} total={deck.length}/><div className="new-stage connection-stage"><span className="game-chip"><Link2/> {card.category}</span><div className="connection-value"><small>قيمة الرابط الآن</small><strong>{timedOut?0:points}</strong><span>نقطة</span></div><div className="connection-clues" aria-label={`ظهر ${clueCount} من 4 تلميحات`}>{card.clues.map((clue,index)=><div key={clue} className={index<clueCount?'visible':'locked'}><b>{index+1}</b><span>{index<clueCount?clue:'؟'}</span></div>)}</div><Countdown key={card.id} seconds={seconds} stopped={revealed} onExpire={()=>{setTimedOut(true);setNotice('انتهى الوقت · بلا نقاط');setRevealed(true);}}/>{!revealed?<form className="connection-answer" onSubmit={submit}><label htmlFor="connection-answer">دور {teams[active].name} · ما الرابط؟</label><div><input id="connection-answer" value={answer} onChange={event=>setAnswer(event.target.value)} maxLength={40} autoComplete="off" placeholder="اكتبوا الرابط هنا…"/><button className="primary" type="submit"><Send/> تأكيد</button></div>{notice?<p className="connection-notice" role="status">{notice}</p>:<p className="connection-notice" aria-hidden="true"/>}<button className="quiet connection-give-up" type="button" onClick={giveUp}><Eye/> ما عرفنا · اكشف الرابط</button></form>:<div className={`connection-reveal ${notice.includes('صحيحة')?'correct':'wrong'}`} role="status"><Lightbulb/><small>{notice}</small><h2>{card.answer}</h2><p>{card.explanation}</p><button className="primary" onClick={next}>{round+1===deck.length?'عرض النتيجة':'الرابط التالي'}</button></div>}</div></>}</section>;
}

export function FamilyFeudGame({ onHome }: GameProps) {
  const [teams,setTeams]=useState(initialTeams); const [seconds,setSeconds]=useNewGameNumber('family','seconds',60); const [rounds,setRounds]=useNewGameNumber('family','rounds',4); const [deck,setDeck]=useState(feudRounds); const [round,setRound]=useState(0); const [active,setActive]=useState(0); const [revealed,setRevealed]=useState<number[]>([]); const [strikes,setStrikes]=useState(0); const [timedOut,setTimedOut]=useState(false); const [phase,setPhase]=useState<'setup'|'play'|'result'>('setup'); const [hostFeedback,setHostFeedback]=useState<FamilyHostState['feedback']>(null);
  const availableRounds=deck.length; const current=deck[round]; const roundScore=revealed.reduce((total,index)=>total+Number(current.answers[index][1]),0);
  const start=()=>{setDeck(drawWithoutRepeats('feud',feudRounds,rounds,item=>item.id));setTeams(prepareTeams(teams));setRound(0);setActive(0);setRevealed([]);setStrikes(0);setTimedOut(false);setHostFeedback(null);setPhase('play');};
  const reveal=(index:number)=>{if(!timedOut)setRevealed(value=>value.includes(index)?value:[...value,index]);};
  const addStrike=()=>{if(timedOut)return;setStrikes(value=>{const next=Math.min(3,value+1);if(next===3&&value<3)setActive(team=>1-team);return next;});};
  const switchTeam=()=>{if(!timedOut)setActive(team=>1-team);};
  const awardRound=()=>{setTeams(value=>value.map((team,index)=>index===active?{...team,score:team.score+roundScore}:team));setHostFeedback(null);if(round+1>=availableRounds)setPhase('result');else{setRound(round+1);setActive((round+1)%2);setRevealed([]);setStrikes(0);setTimedOut(false);}};
  const handleHostCommand=(command:FamilyHostCommand)=>{
    if(phase!=='play')return;
    if(command.type==='strike'){addStrike();setHostFeedback({kind:'wrong',text:'سُجلت ضربة على الفريق'});return;}
    if(command.type==='switch-team'){switchTeam();setHostFeedback({kind:'info',text:'تم تحويل الدور للفريق الآخر'});return;}
    if(command.type==='award-round'){if(revealed.length||timedOut)awardRound();return;}
    if(timedOut)return;
    const submitted=normalizeFamilyAnswer(command.answer);
    const match=current.answers.findIndex(([answer])=>{const expected=normalizeFamilyAnswer(answer);return expected===submitted||(Math.min(expected.length,submitted.length)>=4&&(expected.includes(submitted)||submitted.includes(expected)));});
    if(match<0){addStrike();setHostFeedback({kind:'wrong',text:`«${command.answer.trim()}» غير موجودة في اللوحة · ضربة`});return;}
    if(revealed.includes(match)){setHostFeedback({kind:'info',text:`«${current.answers[match][0]}» مكشوفة من قبل`});return;}
    reveal(match);setHostFeedback({kind:'correct',text:`إجابة موجودة: ${current.answers[match][0]} · ${current.answers[match][1]} نقطة`});
  };
  const hostState:FamilyHostState={type:'family-state',phase,round,totalRounds:availableRounds,question:phase==='play'?current.question:'',answers:current.answers.map(([answer,points],index)=>({answer,points:Number(points),revealed:revealed.includes(index)})),teams,active,strikes,roundScore,timedOut,feedback:hostFeedback};
  const hostRoom=useFamilyHostRoom(hostState,handleHostCommand);
  return <section className="arena new-game feud-game"><GameHeader eyebrow="تحدي العائلة" title={phase==='setup'?'الإجابة الأشهر تكسب.':phase==='result'?'لوحة الجمهور اكتملت!':`الجولة ${round+1} · ${teams[active].name}`} onHome={onHome}/>{phase==='setup'?<TeamSetup {...{teams,setTeams,seconds,setSeconds,rounds,setRounds}} onStart={start}><small className="auto-save-note">بنك متجدد من ثماني جولات بإجابات الجمهور.</small><HostPairingPanel status={hostRoom.status} hostUrl={hostRoom.hostUrl} qrCode={hostRoom.qrCode}/></TeamSetup>:phase==='result'?<GameResult title="أبطال تحدي العائلة" teams={teams} onReplay={start} onSetup={()=>setPhase('setup')}/>:<><HostPairingPanel status={hostRoom.status} hostUrl={hostRoom.hostUrl} qrCode={hostRoom.qrCode} compact/><Scorebar teams={teams} turn={active} round={round} total={availableRounds}/><div className="new-stage feud-stage"><h2>{current.question}</h2><Countdown key={current.id} seconds={seconds} stopped={timedOut||revealed.length===current.answers.length} onExpire={()=>setTimedOut(true)}/>{timedOut?<p className="validation" role="status">انتهى الوقت · ظهرت الإجابات المتبقية دون إضافتها للنقاط</p>:null}<div className="strike-row">{[0,1,2].map(index=><span key={index} className={index<strikes?'on':''}>✕</span>)}</div><div className="feud-board">{current.answers.map(([answer,points],index)=>{const visible=timedOut||revealed.includes(index);return <button key={answer} disabled={timedOut} className={visible?'revealed':''} onClick={()=>reveal(index)}><span>{index+1}</span><b>{visible?answer:'••••••'}</b><strong>{visible?points:'?'}</strong></button>})}</div><div className="feud-controls"><button className="wrong" disabled={timedOut||strikes===3} onClick={addStrike}><X/> خطأ / ضربة</button><button className="secondary" disabled={timedOut} onClick={switchTeam}>تحويل الدور إلى {teams[1-active].name}</button><button className="primary" disabled={!revealed.length&&!timedOut} onClick={awardRound}>{roundScore?`منح ${roundScore} نقطة وإنهاء الجولة`:'إنهاء الجولة بلا نقاط'}</button></div></div></>}</section>;
}

function GameResult({ title, teams, onReplay, onSetup }: { title: string; teams: Team[]; onReplay: () => void; onSetup: () => void }) {
  const winner = teams[0].score===teams[1].score ? null : teams[0].score>teams[1].score ? 0 : 1;
  return <div className="new-result"><Trophy/><span className="eyebrow">{title}</span><h2>{winner===null?'تعادل… كلكم قدّها!':`${teams[winner].name}… قدّها!`}</h2><div className="new-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><b>{team.name}</b><strong>{team.score}</strong></span>)}</div><div className="result-actions"><button className="primary" onClick={onReplay}><RotateCcw/> إعادة بنفس الإعدادات</button><button className="secondary" onClick={onSetup}>تعديل الإعدادات</button></div></div>;
}
