import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, Check, Eye, Flag, Image as ImageIcon, Lightbulb, RefreshCw, RotateCcw, Sparkles, Trophy, Users } from 'lucide-react';
import { loadHuroofPreferences } from '../../utils/huroofStorage';
import { loadSharedTeams, saveSharedTeams } from '../../utils/sharedTeams';
import { drawWithoutRepeats } from '../../utils/newGameRotation';
import { useNewGameNumber } from '../../utils/newGameSettings';
import Countdown from './Countdown';
import '../../photo-real.css';

type Team = { name: string; color: string; score: number };
type GameProps = { onHome: () => void };
type PhotoClue = { title: string; revealLabel: string };
type PhotoCard = {
  id: string;
  answer: string;
  category: string;
  clues: PhotoClue[];
  hints: [string, string];
  explanation: string;
};

const colors = ['#45b6ff', '#ff70b5', '#a77bff', '#ffd45a'];

// Original Qaddha rebus set: the photos are the clue. Their labels stay hidden until the answer is revealed.
const cards: PhotoCard[] = [
  { id:'real-photo-01', answer:'عين شمس', category:'مكان', clues:[{title:'Human_eye',revealLabel:'عين'},{title:'Sun',revealLabel:'شمس'}], hints:['اسم مكان من كلمتين','الكلمة الأولى جزء من الوجه'], explanation:'عين + شمس = عين شمس' },
  { id:'real-photo-02', answer:'رأس الخيمة', category:'مكان', clues:[{title:'Human_head',revealLabel:'رأس'},{title:'Tent',revealLabel:'خيمة'}], hints:['اسم إمارة عربية','الكلمة الثانية مكان للسكن المؤقت'], explanation:'رأس + خيمة = رأس الخيمة' },
  { id:'real-photo-03', answer:'بيت لحم', category:'مكان', clues:[{title:'House',revealLabel:'بيت'},{title:'Meat',revealLabel:'لحم'}], hints:['مدينة عربية تاريخية','الإجابة من كلمتين'], explanation:'بيت + لحم = بيت لحم' },
  { id:'real-photo-04', answer:'كرة القدم', category:'رياضة', clues:[{title:'Ball',revealLabel:'كرة'},{title:'Foot',revealLabel:'قدم'}], hints:['رياضة جماعية','الإجابة من كلمتين'], explanation:'كرة + قدم = كرة القدم' },
  { id:'real-photo-05', answer:'برج الساعة', category:'مكان/معلم', clues:[{title:'Tower',revealLabel:'برج'},{title:'Clock',revealLabel:'ساعة'}], hints:['معلم أو وصف لمبنى','الكلمة الثانية تقيس الوقت'], explanation:'برج + ساعة = برج الساعة' },
  { id:'real-photo-06', answer:'طريق الحرير', category:'تاريخ', clues:[{title:'Road',revealLabel:'طريق'},{title:'Silk',revealLabel:'حرير'}], hints:['مرتبط بالتجارة القديمة','الإجابة من كلمتين'], explanation:'طريق + حرير = طريق الحرير' },
  { id:'real-photo-07', answer:'حصان طروادة', category:'تاريخ', clues:[{title:'Horse',revealLabel:'حصان'},{title:'Troy',revealLabel:'طروادة'}], hints:['قصة شهيرة من التاريخ القديم','الكلمة الأولى حيوان'], explanation:'حصان + طروادة = حصان طروادة' },
  { id:'real-photo-08', answer:'البحر الأحمر', category:'جغرافيا', clues:[{title:'Sea',revealLabel:'بحر'},{title:'Red_rose',revealLabel:'أحمر'}], hints:['مسطح مائي معروف','اللون هو مفتاح الصورة الثانية'], explanation:'بحر + اللون الأحمر = البحر الأحمر' },
  { id:'real-photo-09', answer:'نجم البحر', category:'طبيعة', clues:[{title:'Star',revealLabel:'نجم'},{title:'Sea',revealLabel:'بحر'}], hints:['كائن بحري','الإجابة من كلمتين'], explanation:'نجم + بحر = نجم البحر' },
  { id:'real-photo-10', answer:'كرة السلة', category:'رياضة', clues:[{title:'Ball',revealLabel:'كرة'},{title:'Basket',revealLabel:'سلة'}], hints:['رياضة مشهورة','الصورة الثانية هي هدف التسجيل'], explanation:'كرة + سلة = كرة السلة' },
  { id:'real-photo-11', answer:'مفتاح السيارة', category:'أشياء', clues:[{title:'Key',revealLabel:'مفتاح'},{title:'Car',revealLabel:'سيارة'}], hints:['شيء نحمله معنا','يستخدم للتشغيل أو الفتح'], explanation:'مفتاح + سيارة = مفتاح السيارة' },
  { id:'real-photo-12', answer:'باب البحر', category:'تركيب كلمات', clues:[{title:'Door',revealLabel:'باب'},{title:'Sea',revealLabel:'بحر'}], hints:['الإجابة من كلمتين','الصورة الأولى مدخل'], explanation:'باب + بحر = باب البحر' },
  { id:'real-photo-13', answer:'جبل طويق', category:'السعودية', clues:[{title:'Mountain',revealLabel:'جبل'},{title:'Tuwaiq',revealLabel:'طويق'}], hints:['معلم جغرافي سعودي','الإجابة من كلمتين'], explanation:'جبل + طويق = جبل طويق' },
  { id:'real-photo-14', answer:'حليب جوز الهند', category:'طعام', clues:[{title:'Milk',revealLabel:'حليب'},{title:'Coconut',revealLabel:'جوز الهند'}], hints:['مشروب/مكوّن غذائي','الإجابة ثلاث كلمات'], explanation:'حليب + جوز الهند = حليب جوز الهند' },
  { id:'real-photo-15', answer:'كأس العالم', category:'رياضة', clues:[{title:'Trophy',revealLabel:'كأس'},{title:'Earth',revealLabel:'العالم'}], hints:['بطولة عالمية','الصورة الأولى جائزة'], explanation:'كأس + العالم = كأس العالم' },
  { id:'real-photo-16', answer:'ساعة الرمل', category:'أشياء', clues:[{title:'Clock',revealLabel:'ساعة'},{title:'Sand',revealLabel:'رمل'}], hints:['أداة مرتبطة بالوقت','الإجابة من كلمتين'], explanation:'ساعة + رمل = ساعة الرمل' },
  { id:'real-photo-17', answer:'ماء الورد', category:'أشياء', clues:[{title:'Water',revealLabel:'ماء'},{title:'Rose',revealLabel:'ورد'}], hints:['يستخدم في العطور والطعام','الإجابة من كلمتين'], explanation:'ماء + ورد = ماء الورد' },
  { id:'real-photo-18', answer:'شجرة العائلة', category:'عائلة', clues:[{title:'Tree',revealLabel:'شجرة'},{title:'Family',revealLabel:'عائلة'}], hints:['تمثل العلاقات بين الأقارب','الإجابة من كلمتين'], explanation:'شجرة + عائلة = شجرة العائلة' },
  { id:'real-photo-19', answer:'حصان البحر', category:'طبيعة', clues:[{title:'Horse',revealLabel:'حصان'},{title:'Sea',revealLabel:'بحر'}], hints:['كائن بحري صغير','اسمه يجمع حيوانًا ومكانًا'], explanation:'حصان + بحر = حصان البحر' },
  { id:'real-photo-20', answer:'رجل الثلج', category:'أشياء', clues:[{title:'Man',revealLabel:'رجل'},{title:'Snow',revealLabel:'ثلج'}], hints:['يظهر غالبًا في الشتاء','الإجابة من كلمتين'], explanation:'رجل + ثلج = رجل الثلج' },
  { id:'real-photo-21', answer:'عين الماء', category:'طبيعة', clues:[{title:'Human_eye',revealLabel:'عين'},{title:'Water',revealLabel:'ماء'}], hints:['مصدر طبيعي للمياه','الإجابة من كلمتين'], explanation:'عين + ماء = عين الماء' },
  { id:'real-photo-22', answer:'قلب الأسد', category:'تعبير', clues:[{title:'Heart',revealLabel:'قلب'},{title:'Lion',revealLabel:'أسد'}], hints:['تعبير يدل على الشجاعة','الصورة الثانية ملك الغابة'], explanation:'قلب + أسد = قلب الأسد' },
  { id:'real-photo-23', answer:'لسان البحر', category:'طبيعة/جغرافيا', clues:[{title:'Tongue',revealLabel:'لسان'},{title:'Sea',revealLabel:'بحر'}], hints:['تعبير جغرافي من كلمتين','الكلمة الأولى عضو في الفم'], explanation:'لسان + بحر = لسان البحر' },
  { id:'real-photo-24', answer:'قلب المدينة', category:'تعبير', clues:[{title:'Heart',revealLabel:'قلب'},{title:'City',revealLabel:'مدينة'}], hints:['يعني مركز المكان الحيوي','الإجابة من كلمتين'], explanation:'قلب + مدينة = قلب المدينة' },
];

const imageCache = new Map<string,string>();
async function fetchWikiImage(title: string): Promise<string> {
  if (imageCache.has(title)) return imageCache.get(title)!;
  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('image lookup failed');
  const data = await response.json() as { thumbnail?: { source?: string }; originalimage?: { source?: string } };
  const url = data.originalimage?.source || data.thumbnail?.source;
  if (!url) throw new Error('no image');
  imageCache.set(title,url);
  return url;
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

function RealClueImage({ clue, revealed }: { clue: PhotoClue; revealed: boolean }) {
  const [src,setSrc]=useState('');
  const [failed,setFailed]=useState(false);
  useEffect(()=>{let live=true;setSrc('');setFailed(false);void fetchWikiImage(clue.title).then(url=>{if(live)setSrc(url)}).catch(()=>{if(live)setFailed(true)});return()=>{live=false};},[clue.title]);
  return <div className="real-photo-tile">{src?<img src={src} alt="" referrerPolicy="no-referrer"/>:<div className="real-photo-loading">{failed?<ImageIcon/>:<RefreshCw className="spin"/>}</div>}{revealed?<span>{clue.revealLabel}</span>:null}</div>;
}

export default function PhotoChallengeReal({ onHome }: GameProps) {
  const [teams,setTeams]=useState(initialTeams);
  const [seconds,setSeconds]=useNewGameNumber('photo','seconds',30);
  const [rounds,setRounds]=useNewGameNumber('photo','rounds',6);
  const [deck,setDeck]=useState(cards);
  const [round,setRound]=useState(0);
  const [hintLevel,setHintLevel]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [timedOut,setTimedOut]=useState(false);
  const [phase,setPhase]=useState<'setup'|'play'|'result'>('setup');
  const card=deck[round];
  const valid=teams.every(t=>t.name.trim())&&teams[0].name.trim()!==teams[1].name.trim();
  const winner=useMemo(()=>teams[0].score===teams[1].score?null:teams[0].score>teams[1].score?0:1,[teams]);
  const points=Math.max(100,300-hintLevel*100);
  const updateTeam=(index:number,patch:Partial<Team>)=>setTeams(current=>current.map((team,i)=>i===index?{...team,...patch}:team));
  const start=()=>{const prepared=teams.map(team=>({...team,name:team.name.trim(),score:0}));saveSharedTeams(prepared);setTeams(prepared);setDeck(drawWithoutRepeats('photos-real-v2',cards,rounds,item=>item.id));setRound(0);setHintLevel(0);setRevealed(false);setTimedOut(false);setPhase('play');};
  const award=(team:number|null)=>{if(team!==null&&!timedOut)setTeams(value=>value.map((item,index)=>index===team?{...item,score:item.score+points}:item));if(round+1>=deck.length)setPhase('result');else{setRound(value=>value+1);setHintLevel(0);setRevealed(false);setTimedOut(false);}};

  return <section className="arena new-game photo-game real-photo-game">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={15}/> تحدي الصور</span><h1>{phase==='setup'?'شوف الصور… واربط المعنى.':phase==='result'?'خلص التحدّي!':`اللغز ${round+1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>
    {phase==='setup'?<div className="new-game-setup"><div className="section-heading"><h2>الصور نفسها هي اللغز</h2><p>كل صورتين أو أكثر بينهم رابط مباشر، وإذا جمعت معنى الصور تطلع لك كلمة أو عبارة. الصور واضحة من البداية بدون تغبيش، ولا نكشف أسماءها إلا بعد الحل.</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor compact-team" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users/><span>0{index+1}</span></div><label>اسم الفريق {index===0?'الأول':'الثاني'}</label><input maxLength={22} value={team.name} onChange={event=>updateTeam(index,{name:event.target.value})}/><div className="color-choices">{colors.map(color=><button key={color} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>updateTeam(index,{color})}>{team.color===color?<Check size={16}/>:null}</button>)}</div></div>)}</div><div className="match-settings new-game-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة اللغز<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>عدد الألغاز<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={4}>4 ألغاز</option><option value={6}>6 ألغاز</option><option value={8}>8 ألغاز</option></select></label></div>{!valid?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:null}<div className="arena-actions"><span>صور حقيقية واضحة + ربط بصري + محتوى أصلي لقدّها.</span><button className="primary" disabled={!valid} onClick={start}>ابدأوا التحدّي <Flag size={18}/></button></div></div>:phase==='result'?<div className="new-result"><Trophy/><span className="eyebrow">نهاية التحدي</span><h2>{winner===null?'تعادل… كلكم قدّها!':`${teams[winner].name}… قدّها!`}</h2><div className="new-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><b>{team.name}</b><strong>{team.score}</strong></span>)}</div><div className="result-actions"><button className="primary" onClick={start}><RotateCcw/> إعادة</button><button className="secondary" onClick={()=>setPhase('setup')}>تعديل الإعدادات</button></div></div>:<><div className="new-scorebar">{teams.map((team,index)=><div key={team.name} className={round%2===index?'active':''} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong></div>)}<p>الجولة <b>{round+1}</b> / {deck.length}</p></div><div className="new-stage real-photo-stage"><span className="game-chip">{card.category}</span><div className="real-photo-equation"><div className="real-photo-grid">{card.clues.map((clue,index)=><div className="real-photo-piece" key={`${card.id}-${index}`}><RealClueImage clue={clue} revealed={revealed}/>{index<card.clues.length-1?<b className="photo-plus" aria-hidden="true">+</b>:null}</div>)}</div><span className="photo-equals" aria-hidden="true">= ?</span></div>{hintLevel>0&&!revealed?<div className="photo-hints">{card.hints.slice(0,hintLevel).map((hint,index)=><p key={hint}><Lightbulb size={16}/><b>تلميح {index+1}</b><span>{hint}</span></p>)}</div>:null}<p className="photo-points">قيمة الإجابة: <b>{timedOut?0:points}</b> نقطة</p><Countdown key={card.id} seconds={seconds} stopped={revealed} onExpire={()=>{setTimedOut(true);setRevealed(true);}}/>{!revealed?<div className="photo-actions"><button className="secondary" disabled={hintLevel===card.hints.length} onClick={()=>setHintLevel(value=>Math.min(card.hints.length,value+1))}><Lightbulb/> تلميح · نقاط أقل</button><button className="primary" onClick={()=>setRevealed(true)}><Eye/> كشف الإجابة</button></div>:<div className={`answer-feedback ${timedOut?'wrong':'correct'}`}><small>{timedOut?'انتهى الوقت · بلا نقاط':'الإجابة'}</small><h2>{card.answer}</h2><p>{card.explanation}</p><div className="judge-row">{timedOut?<button className="primary" onClick={()=>award(null)}>{round+1===deck.length?'عرض النتيجة':'اللغز التالي'}</button>:<>{teams.map((team,index)=><button key={team.name} style={{'--team':team.color} as CSSProperties} onClick={()=>award(index)}>{team.name} · +{points}</button>)}<button onClick={()=>award(null)}>لا أحد</button></>}</div></div>}</div></>}
  </section>;
}
