import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowRight, Check, Eye, Flag, RotateCcw, Sparkles, Theater, Trophy, Users, X } from 'lucide-react';
import Countdown from './Countdown';

type Props={onHome:()=>void}; type Team={name:string;color:string;score:number};
const palette=['#45b6ff','#ff70b5'];
const charades=['يصوّر سيلفي','يطبخ كبسة','يلعب كرة قدم','يبحث عن جواله','يركب طائرة','يفتح هدية','يخاف من حشرة','يتأخر عن الدوام','يشاهد مباراة','يطلب قهوة','يقود سيارة','ينام في اجتماع','يرقص في عرس','يحاول فتح مظلة','يصور غروب الشمس','يلعب بلايستيشن','يركب دراجة','يتسوق بسرعة','ينفخ بالونًا','يصلح جهازًا'];
const spySets=[
 {place:'المطار',words:['بوابة الصعود','جواز السفر','حقيبة السفر','برج المراقبة']},
 {place:'المطعم',words:['قائمة الطعام','النادل','الحساب','طاولة الحجز']},
 {place:'الملعب',words:['الحكم','المدرج','صافرة','غرفة الملابس']},
 {place:'المدرسة',words:['السبورة','الفسحة','الواجب','جرس الحصة']},
 {place:'المستشفى',words:['موعد','سماعة الطبيب','صيدلية','غرفة انتظار']},
 {place:'الشاطئ',words:['مظلة','رمل','منشفة','قارب']},
];
function shuffle<T>(values:T[]){return [...values].sort(()=>Math.random()-.5)}
function Shell({title,subtitle,onHome,children,kind}:{title:string;subtitle:string;onHome:()=>void;children:React.ReactNode;kind:string}){
 return <section className={'final-game '+kind} dir="rtl"><header className="final-head"><button className="quiet" onClick={onHome}><ArrowRight/> الألعاب</button><div><span><Sparkles/></span><small>لعبة أصلية من قدّها</small><h1>{title}</h1><p>{subtitle}</p></div></header>{children}</section>
}
function Setup({teams,setTeams,rounds,setRounds,onStart}:{teams:Team[];setTeams:(x:Team[])=>void;rounds:number;setRounds:(x:number)=>void;onStart:()=>void}){
 const valid=teams.every(x=>x.name.trim())&&teams[0].name.trim()!==teams[1].name.trim();
 return <article className="final-panel setup-panel"><h2>جهّزوا الفريقين</h2><div className="final-teams">{teams.map((t,i)=><label key={i} style={{'--team':t.color} as CSSProperties}><Users/><span>الفريق {i+1}</span><input maxLength={18} value={t.name} onChange={e=>setTeams(teams.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/></label>)}</div><label className="round-select">عدد الجولات<select value={rounds} onChange={e=>setRounds(Number(e.target.value))}><option value="6">6</option><option value="8">8</option><option value="10">10</option></select></label><button className="primary" disabled={!valid} onClick={onStart}>ابدأ التحدي <Flag/></button></article>
}
function Score({teams,round,total}:{teams:Team[];round:number;total:number}){return <div className="final-score"><b style={{color:teams[0].color}}>{teams[0].name} <strong>{teams[0].score}</strong></b><span>الجولة {Math.min(round+1,total)} / {total}</span><b style={{color:teams[1].color}}>{teams[1].name} <strong>{teams[1].score}</strong></b></div>}
function Result({teams,onReplay,onSetup}:{teams:Team[];onReplay:()=>void;onSetup:()=>void}){const winner=teams[0].score===teams[1].score?'تعادل قوي!':teams[0].score>teams[1].score?teams[0].name:teams[1].name;return <article className="final-panel final-result"><Trophy/><small>انتهى التحدي</small><h2>{winner}</h2><div>{teams.map(t=><b key={t.name} style={{color:t.color}}>{t.name}<strong>{t.score}</strong></b>)}</div><button className="primary" onClick={onReplay}><RotateCcw/> إعادة بنفس الإعدادات</button><button className="quiet" onClick={onSetup}>تغيير الإعدادات</button></article>}

export function SilentActingGame({onHome}:Props){
 const [teams,setTeams]=useState<Team[]>([{name:'الفريق الأول',color:palette[0],score:0},{name:'الفريق الثاني',color:palette[1],score:0}]);
 const [rounds,setRounds]=useState(8),[round,setRound]=useState(0),[deck,setDeck]=useState<string[]>([]),[phase,setPhase]=useState<'setup'|'hidden'|'play'|'result'>('setup');
 const current=deck[round],turn=round%2;
 const start=()=>{setTeams(teams.map(t=>({...t,name:t.name.trim(),score:0})));setDeck(shuffle(charades).slice(0,rounds));setRound(0);setPhase('hidden')};
 const finish=(won:boolean)=>{if(won)setTeams(v=>v.map((t,i)=>i===turn?{...t,score:t.score+100}:t));if(round+1>=deck.length)setPhase('result');else{setRound(r=>r+1);setPhase('hidden')}};
 return <Shell kind="acting-game" title="مثّلها" subtitle="مثّل العبارة من دون كلام… وفريقك لازم يلقطها قبل الوقت." onHome={onHome}>{phase==='setup'?<Setup {...{teams,setTeams,rounds,setRounds}} onStart={start}/>:phase==='result'?<Result teams={teams} onReplay={start} onSetup={()=>setPhase('setup')}/>:<><Score teams={teams} round={round} total={deck.length}/><article className="final-panel play-panel">{phase==='hidden'?<><Theater className="feature-icon"/><small>مرّر الجهاز إلى ممثل {teams[turn].name}</small><h2>العبارة مخفية عن البقية</h2><button className="primary" onClick={()=>setPhase('play')}><Eye/> شاهد العبارة وابدأ</button></>:<><span className="turn-chip" style={{'--team':teams[turn].color} as CSSProperties}>دور {teams[turn].name}</span><h2 className="prompt">{current}</h2><p>ممنوع الكلام أو إصدار أصوات أو تهجئة الحروف.</p><Countdown key={round} seconds={45} stopped={false} onExpire={()=>finish(false)}/><div className="play-actions"><button className="success" onClick={()=>finish(true)}><Check/> عرفوها</button><button className="danger" onClick={()=>finish(false)}><X/> تخطي</button></div></>}</article></>}</Shell>
}

export function SecretWordGame({onHome}:Props){
 const [names,setNames]=useState(['لاعب 1','لاعب 2','لاعب 3','لاعب 4']),[phase,setPhase]=useState<'setup'|'pass'|'talk'|'vote'|'result'>('setup'),[index,setIndex]=useState(0),[seen,setSeen]=useState(false),[spy,setSpy]=useState(0),[set,setSet]=useState(spySets[0]),[votes,setVotes]=useState<number[]>([]);
 const start=()=>{const clean=names.map((n,i)=>n.trim()||'لاعب '+(i+1));setNames(clean);setSpy(Math.floor(Math.random()*clean.length));setSet(spySets[Math.floor(Math.random()*spySets.length)]);setIndex(0);setSeen(false);setVotes([]);setPhase('pass')};
 const next=()=>{if(index+1>=names.length)setPhase('talk');else{setIndex(i=>i+1);setSeen(false)}};
 const addPlayer=()=>names.length<10&&setNames([...names,'لاعب '+(names.length+1)]);
 const removePlayer=()=>names.length>3&&setNames(names.slice(0,-1));
 const vote=(i:number)=>{const next=[...votes,i];setVotes(next);if(next.length===names.length)setPhase('result')};
 const accused=useMemo(()=>votes.length?votes.reduce((best,x)=>votes.filter(v=>v===x).length>votes.filter(v=>v===best).length?x:best,votes[0]):-1,[votes]);
 useEffect(()=>{if(phase==='setup')return;try{localStorage.setItem('qaddha.secret.active',JSON.stringify({phase,index,names}))}catch{/* Storage is optional in private browsing. */}},[phase,index,names]);
 return <Shell kind="secret-game" title="الكلمة السرّية" subtitle="الكل يعرف المكان إلا المتخفي. اسألوا بذكاء واكشفوه قبل ما يخمّن." onHome={onHome}>{phase==='setup'?<article className="final-panel setup-panel"><h2>من داخل الجولة؟</h2><div className="player-names">{names.map((n,i)=><input key={i} maxLength={15} aria-label={'اسم اللاعب '+(i+1)} value={n} onChange={e=>setNames(names.map((x,j)=>j===i?e.target.value:x))}/>)}</div><div className="count-actions"><button onClick={removePlayer} disabled={names.length<=3}>− لاعب</button><span>{names.length} لاعبين</span><button onClick={addPlayer} disabled={names.length>=10}>+ لاعب</button></div><button className="primary" onClick={start}>وزّع الأدوار بسرّية</button></article>:phase==='pass'?<article className="final-panel play-panel"><Users className="feature-icon"/><small>مرّر الجوال إلى</small><h2>{names[index]}</h2>{!seen?<button className="primary" onClick={()=>setSeen(true)}><Eye/> اكشف دورك</button>:<><div className={'secret-role '+(index===spy?'spy':'citizen')}><small>دورك</small><strong>{index===spy?'أنت المتخفي':set.place}</strong><p>{index===spy?'اسأل واندس بينهم، وحاول تخمين المكان.':'كلمتك: '+set.words[index%set.words.length]}</p></div><button className="primary" onClick={next}>حفظت · اللاعب التالي</button></>}</article>:phase==='talk'?<article className="final-panel play-panel"><span className="turn-chip">مرحلة الأسئلة</span><h2>لكل لاعب سؤال واحد</h2><p>لا تذكروا المكان أو الكلمة مباشرة. المتخفي يحاول يندمج.</p><Countdown seconds={120} stopped={false} onExpire={()=>setPhase('vote')}/><button className="primary" onClick={()=>setPhase('vote')}>جاهزين للتصويت</button></article>:phase==='vote'?<article className="final-panel play-panel"><h2>مين المتخفي؟</h2><p>صوّتوا بالترتيب. كل لاعب يختار اسمًا واحدًا.</p><b className="vote-progress">{votes.length+1} / {names.length}</b><div className="vote-grid">{names.map((n,i)=><button key={i} onClick={()=>vote(i)}>{n}</button>)}</div></article>:<article className="final-panel final-result"><Trophy/><small>كشف الأدوار</small><h2>{accused===spy?'انكشف المتخفي!':'المتخفي نجا!'}</h2><p>المتخفي كان <b>{names[spy]}</b> · المكان: <b>{set.place}</b></p><button className="primary" onClick={start}><RotateCcw/> جولة جديدة</button><button className="quiet" onClick={()=>setPhase('setup')}>تغيير اللاعبين</button></article>}</Shell>
}
