import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, Flag, RotateCcw, ShieldCheck, Theater, Timer, Trophy, UserRoundPlus, Users, Vote, X } from 'lucide-react';
import Countdown from './Countdown';

type Props = { onHome: () => void };
type Team = { name: string; color: string; score: number };
const palette = ['#45b6ff', '#ff70b5'];
const ONLINE_PARAMS = new URLSearchParams(window.location.search);
const ONLINE_EMBED = ONLINE_PARAMS.get('onlineEmbed') === '1';
const ONLINE_TEAM_NAMES: [string, string] = [
  ONLINE_PARAMS.get('onlineTeam0')?.trim() || 'الفريق الأول',
  ONLINE_PARAMS.get('onlineTeam1')?.trim() || 'الفريق الثاني',
];
const ONLINE_TIMER = Number(ONLINE_PARAMS.get('onlineTimer') || '45');
const ONLINE_ROUNDS = Number(ONLINE_PARAMS.get('onlineRounds') || '8');
const ONLINE_PLAYER_NAME = ONLINE_PARAMS.get('onlineName')?.trim() || '';
const ONLINE_ROSTER = (() => {
  try {
    const parsed = JSON.parse(ONLINE_PARAMS.get('onlineRoster') || '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string' && Boolean(value.trim())).slice(0, 12) : [];
  } catch { return []; }
})();
const ONLINE_SEED = ONLINE_PARAMS.get('onlineSeed') || 'qaddha-online';
const stableIndex = (value:string, size:number) => {
  let hash = 2166136261 >>> 0;
  for (let index=0; index<value.length; index+=1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return size > 0 ? hash % size : 0;
};
const charades = ['يصوّر سيلفي','يطبخ كبسة','يلعب كرة قدم','يبحث عن جواله','يركب طائرة','يفتح هدية','يخاف من حشرة','يتأخر عن الدوام','يشاهد مباراة','يطلب قهوة','يقود سيارة','ينام في اجتماع','يرقص في عرس','يحاول فتح مظلة','يصور غروب الشمس','يلعب بلايستيشن','يركب دراجة','يتسوق بسرعة','ينفخ بالونًا','يصلح جهازًا'];
const spySets = [
  { place:'المطار', words:['بوابة الصعود','جواز السفر','حقيبة السفر','برج المراقبة'] },
  { place:'المطعم', words:['قائمة الطعام','النادل','الحساب','طاولة الحجز'] },
  { place:'الملعب', words:['الحكم','المدرج','صافرة','غرفة الملابس'] },
  { place:'المدرسة', words:['السبورة','الفسحة','الواجب','جرس الحصة'] },
  { place:'المستشفى', words:['موعد','سماعة الطبيب','صيدلية','غرفة انتظار'] },
  { place:'الشاطئ', words:['مظلة','رمل','منشفة','قارب'] },
];
function shuffle<T>(values: T[]) { return [...values].sort(() => Math.random() - .5); }

function Shell({ title, subtitle, onHome, children, kind, icon }: { title:string; subtitle:string; onHome:()=>void; children:React.ReactNode; kind:string; icon:React.ReactNode }) {
  return <section className={`final-game ${kind}`} dir="rtl"><header className="final-head"><button className="quiet" onClick={onHome}><ArrowRight/> الألعاب</button><div><span>{icon}</span><div><small>لعبة جماعية من قدّها</small><h1>{title}</h1><p>{subtitle}</p></div></div><div className="final-head-tags"><b><Users/> جماعية</b><b><Timer/> مؤقت</b></div></header>{children}</section>;
}

function ActingSetup({ teams, setTeams, rounds, setRounds, seconds, setSeconds, onStart }: { teams:Team[]; setTeams:(teams:Team[])=>void; rounds:number; setRounds:(rounds:number)=>void; seconds:number; setSeconds:(seconds:number)=>void; onStart:()=>void }) {
  const valid = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();
  return <article className="final-panel setup-panel"><div className="panel-kicker"><Flag/> تجهيز المباراة</div><h2>جهّزوا الفريقين</h2><p className="setup-help">كل جولة لفريق واحد. الممثل يشوف العبارة لحاله، ثم يبدأ الوقت.</p><div className="final-teams">{teams.map((team,index)=><label key={index} style={{'--team':team.color} as CSSProperties}><span className="team-number">0{index+1}</span><Users/><small>اسم الفريق</small><input aria-label={`اسم الفريق ${index+1}`} maxLength={18} value={team.name} onChange={event=>setTeams(teams.map((item,itemIndex)=>itemIndex===index?{...item,name:event.target.value}:item))}/></label>)}</div><div className="final-settings"><label><span>عدد الجولات</span><select value={rounds} onChange={event=>setRounds(Number(event.target.value))}>{[6,8,10].map(value=><option key={value} value={value}>{value} جولات</option>)}</select></label><label><span>وقت التمثيل</span><select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}>{[30,45,60].map(value=><option key={value} value={value}>{value} ثانية</option>)}</select></label></div><button className="primary final-start" disabled={!valid} onClick={onStart}>ابدأ التحدّي <ArrowLeft/></button></article>;
}

function Score({ teams, round, total }: { teams:Team[]; round:number; total:number }) {
  const progress = total ? Math.min(100, ((round + 1) / total) * 100) : 0;
  return <div className="final-score"><b style={{'--team':teams[0].color} as CSSProperties}><span>{teams[0].name}</span><strong>{teams[0].score}</strong></b><div><small>الجولة {Math.min(round+1,total)} من {total}</small><i><span style={{width:`${progress}%`}}/></i></div><b style={{'--team':teams[1].color} as CSSProperties}><span>{teams[1].name}</span><strong>{teams[1].score}</strong></b></div>;
}

function Result({ teams, onReplay, onSetup }: { teams:Team[]; onReplay:()=>void; onSetup:()=>void }) {
  const winner = teams[0].score === teams[1].score ? 'تعادل قوي!' : `${teams[0].score > teams[1].score ? teams[0].name : teams[1].name} أبطال التحدّي`;
  return <article className="final-panel final-result"><div className="result-trophy"><Trophy/></div><small>النتيجة النهائية</small><h2>{winner}</h2><div className="result-scores">{teams.map(team=><b key={team.name} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong><small>نقطة</small></b>)}</div><div className="result-actions"><button className="primary" onClick={onReplay}><RotateCcw/> إعادة بنفس الإعدادات</button><button className="secondary" onClick={onSetup}>تغيير الإعدادات</button></div></article>;
}

export function SilentActingGame({ onHome }: Props) {
  const [teams,setTeams] = useState<Team[]>([
    {name:ONLINE_EMBED?ONLINE_TEAM_NAMES[0]:'الفريق الأول',color:palette[0],score:0},
    {name:ONLINE_EMBED?ONLINE_TEAM_NAMES[1]:'الفريق الثاني',color:palette[1],score:0},
  ]);
  const [rounds,setRounds] = useState(ONLINE_EMBED && [6,8,10].includes(ONLINE_ROUNDS) ? ONLINE_ROUNDS : 8);
  const [seconds,setSeconds] = useState(ONLINE_EMBED && [30,45,60].includes(ONLINE_TIMER) ? ONLINE_TIMER : 45);
  const [round,setRound] = useState(0);
  const [deck,setDeck] = useState<string[]>([]);
  const [phase,setPhase] = useState<'setup'|'handoff'|'ready'|'play'|'result'>('setup');
  const current = deck[round];
  const turn = round % 2;
  const start = () => { setTeams(teams.map(team=>({...team,name:team.name.trim(),score:0}))); setDeck(shuffle(charades).slice(0,rounds)); setRound(0); setPhase('handoff'); };
  useEffect(()=>{ if(ONLINE_EMBED && phase==='setup') start(); },[phase]);
  const finish = (won:boolean) => { if (phase !== 'play') return; if(won)setTeams(value=>value.map((team,index)=>index===turn?{...team,score:team.score+100}:team)); if(round+1>=deck.length)setPhase('result'); else { setRound(value=>value+1); setPhase('handoff'); } };
  return <Shell kind="acting-game" icon={<Theater/>} title="مثّلها" subtitle="تمثيل صامت، وقت يركض، وفريق لازم يلقط العبارة." onHome={onHome}>{phase==='setup'?<ActingSetup {...{teams,setTeams,rounds,setRounds,seconds,setSeconds}} onStart={start}/>:phase==='result'?<Result teams={teams} onReplay={start} onSetup={()=>setPhase('setup')}/>:<><Score teams={teams} round={round} total={deck.length}/><article className={`final-panel play-panel phase-${phase}`}><span className="turn-chip" style={{'--team':teams[turn].color} as CSSProperties}>الجولة لـ {teams[turn].name}</span>{phase==='handoff'?<><div className="handoff-icon"><Theater/></div><small>خصوصية العبارة</small><h2>مرّر الجهاز للممثّل</h2><p>البقية يبعدون نظرهم عن الشاشة. الممثل وحده يضغط التالي.</p><button className="primary" onClick={()=>setPhase('ready')}><ShieldCheck/> الجهاز معي</button></>:phase==='ready'?<><small>عبارتك لهذه الجولة</small><h2 className="prompt secret-prompt">{current}</h2><p>خذ لحظة واستعد. الوقت ما يبدأ إلا بعد ضغط الزر.</p><button className="primary pulse-start" onClick={()=>setPhase('play')}><Timer/> ابدأ {seconds} ثانية</button></>:<><small>مثّل الآن من دون كلام</small><h2 className="prompt">{current}</h2><p>ممنوع الكلام، الأصوات، أو تهجئة الحروف.</p><Countdown key={`${round}-${seconds}`} seconds={seconds} stopped={false} onExpire={()=>finish(false)}/><div className="play-actions"><button className="success" onClick={()=>finish(true)}><Check/> عرفوها · +100</button><button className="danger" onClick={()=>finish(false)}><X/> تخطي</button></div></>}</article></>}</Shell>;
}

export function SecretWordGame({ onHome }: Props) {
  const onlineInitialNames = ONLINE_EMBED && ONLINE_ROSTER.length >= 3 ? ONLINE_ROSTER : ['لاعب 1','لاعب 2','لاعب 3','لاعب 4'];
  const onlineOwnIndex = Math.max(0, onlineInitialNames.findIndex(name => name === ONLINE_PLAYER_NAME));
  const [names,setNames] = useState(onlineInitialNames);
  const [duration,setDuration] = useState(ONLINE_EMBED && [90,120,180].includes(ONLINE_TIMER) ? ONLINE_TIMER : 120);
  const [phase,setPhase] = useState<'setup'|'handoff'|'role'|'talk'|'vote'|'result'>(ONLINE_EMBED ? 'role' : 'setup');
  const [index,setIndex] = useState(ONLINE_EMBED ? onlineOwnIndex : 0);
  const [secretRound,setSecretRound] = useState(0);
  const [spy,setSpy] = useState(() => ONLINE_EMBED ? stableIndex(`${ONLINE_SEED}:spy:0`, onlineInitialNames.length) : 0);
  const [set,setSet] = useState(() => ONLINE_EMBED ? spySets[stableIndex(`${ONLINE_SEED}:set:0`, spySets.length)] : spySets[0]);
  const [votes,setVotes] = useState<number[]>([]);
  const start = () => {
    const clean=names.map((name,i)=>name.trim()||`لاعب ${i+1}`);
    setNames(clean);
    if (ONLINE_EMBED) {
      const nextRound=secretRound+1;
      setSecretRound(nextRound);
      setSpy(stableIndex(`${ONLINE_SEED}:spy:${nextRound}`, clean.length));
      setSet(spySets[stableIndex(`${ONLINE_SEED}:set:${nextRound}`, spySets.length)]);
      setIndex(Math.max(0, clean.findIndex(name => name === ONLINE_PLAYER_NAME)));
      setVotes([]);
      setPhase('role');
      return;
    }
    setSpy(Math.floor(Math.random()*clean.length));
    setSet(spySets[Math.floor(Math.random()*spySets.length)]);
    setIndex(0);
    setVotes([]);
    setPhase('handoff');
  };
  const nextPlayer = () => {
    if (ONLINE_EMBED) { setPhase('talk'); return; }
    if(index+1>=names.length)setPhase('talk'); else { setIndex(value=>value+1); setPhase('handoff'); }
  };
  const addPlayer = () => names.length<10 && setNames([...names,`لاعب ${names.length+1}`]);
  const removePlayer = (removeIndex?:number) => names.length>3 && setNames(names.filter((_,index)=>index!==(removeIndex ?? names.length-1)));
  const vote = (candidate:number) => { const next=[...votes,candidate]; setVotes(next); if(next.length===names.length)setPhase('result'); };
  const accused = useMemo(()=>votes.length?votes.reduce((best,candidate)=>votes.filter(value=>value===candidate).length>votes.filter(value=>value===best).length?candidate:best,votes[0]):-1,[votes]);
  useEffect(()=>{ if(ONLINE_EMBED||phase==='setup'||phase==='result')return; try { sessionStorage.setItem('qaddha.secret.active',JSON.stringify({phase,index,names,duration,spy,set,votes})); } catch {/* optional */} },[phase,index,names,duration,spy,set,votes]);
  return <Shell kind="secret-game" icon={<ShieldCheck/>} title="الكلمة السرّية" subtitle="الكل يعرف المكان إلا المتخفي. اسألوا بذكاء واكشفوه." onHome={onHome}>{phase==='setup'?<article className="final-panel setup-panel secret-setup"><div className="panel-kicker"><UserRoundPlus/> تجهيز اللاعبين</div><h2>مين داخل الجولة؟</h2><p className="setup-help">أقل شيء 3 لاعبين. كل لاعب بيشوف دوره بسرّية ثم يمرّر الجهاز.</p><div className="player-names">{names.map((name,i)=><label key={i}><span>{String(i+1).padStart(2,'0')}</span><input maxLength={15} aria-label={`اسم اللاعب ${i+1}`} value={name} onChange={event=>setNames(names.map((item,itemIndex)=>itemIndex===i?event.target.value:item))}/>{names.length>3&&<button aria-label={`حذف ${name}`} onClick={()=>removePlayer(i)}><X/></button>}</label>)}</div><div className="secret-setup-controls"><button onClick={addPlayer} disabled={names.length>=10}><UserRoundPlus/> إضافة لاعب</button><label><span>وقت النقاش</span><select value={duration} onChange={event=>setDuration(Number(event.target.value))}>{[90,120,180].map(value=><option key={value} value={value}>{value===90?'دقيقة ونصف':`${value/60} دقيقة`}</option>)}</select></label></div><button className="primary final-start" onClick={start}>وزّع الأدوار بسرّية <ArrowLeft/></button></article>:phase==='handoff'?<article className="final-panel play-panel"><span className="secret-progress">اللاعب {index+1} من {names.length}</span><div className="handoff-icon"><Users/></div><small>مرّر الجهاز الآن إلى</small><h2>{names[index]}</h2><p>تأكد إن محد يشوف الشاشة، ثم اكشف دورك.</p><button className="primary" onClick={()=>setPhase('role')}><Eye/> اكشف دوري</button></article>:phase==='role'?<article className="final-panel play-panel"><span className="secret-progress">اللاعب {index+1} من {names.length}</span><div className={`secret-role ${index===spy?'spy':'citizen'}`}><small>{index===spy?'دورك السري':'المكان'}</small><strong>{index===spy?'أنت المتخفي':set.place}</strong><p>{index===spy?'ما عندك كلمة. اندس بينهم وحاول تعرف المكان.':<>كلمتك الخاصة: <b>{set.words[index%set.words.length]}</b></>}</p></div><button className="primary" data-online-local={ONLINE_EMBED?'true':undefined} onClick={nextPlayer}><ShieldCheck/> {ONLINE_EMBED?'حفظت دوري · ادخل النقاش':`حفظت دوري · ${index+1===names.length?'ابدأ النقاش':'مرّر للي بعدي'}`}</button></article>:phase==='talk'?<article className="final-panel play-panel"><span className="turn-chip">مرحلة الأسئلة</span><Vote className="feature-icon"/><h2>اسألوا… ولا تفضحون المكان</h2><p>كل لاعب يسأل سؤالًا واحدًا. المتخفي يحاول يندمج ويجمع الإشارات.</p><Countdown key={duration} seconds={duration} stopped={false} onExpire={()=>setPhase('vote')}/><button className="primary" onClick={()=>setPhase('vote')}>جاهزين للتصويت <ArrowLeft/></button></article>:phase==='vote'?<article className="final-panel play-panel vote-panel"><span className="secret-progress">صوت {Math.min(votes.length+1,names.length)} من {names.length}</span><Vote className="feature-icon"/><h2>مين المتخفي؟</h2><p><b>{names[votes.length]}</b> يصوّت الآن. اختَر اسمًا واحدًا بدون ما تغيّر رأيك.</p><div className="vote-grid">{names.map((name,i)=><button key={i} disabled={i===votes.length||(ONLINE_EMBED&&votes.length!==onlineOwnIndex)} onClick={()=>vote(i)}><Users/>{name}{i===votes.length&&<small>{ONLINE_EMBED&&votes.length!==onlineOwnIndex?'ينتظر':'أنت'}</small>}</button>)}</div></article>:<article className="final-panel final-result secret-result"><div className="result-trophy"><Trophy/></div><small>كشف الأدوار</small><h2>{accused===spy?'انكشف المتخفي!':'المتخفي نجا!'}</h2><div className="secret-reveal"><span>المتخفي<strong>{names[spy]}</strong></span><span>اختيار المجموعة<strong>{names[accused]}</strong></span><span>المكان<strong>{set.place}</strong></span></div><div className="result-actions"><button className="primary" onClick={start}><RotateCcw/> جولة جديدة</button><button className="secondary" onClick={()=>setPhase('setup')}>تغيير اللاعبين</button></div></article>}</Shell>;
}
