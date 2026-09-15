import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, Check, Eye, Flag, Image as ImageIcon, RefreshCw, RotateCcw, Sparkles, Trophy, Users } from 'lucide-react';
import { loadHuroofPreferences } from '../../utils/huroofStorage';
import { loadSharedTeams, saveSharedTeams } from '../../utils/sharedTeams';
import { drawWithoutRepeats } from '../../utils/newGameRotation';
import { useNewGameNumber } from '../../utils/newGameSettings';
import Countdown from './Countdown';

type Team = { name: string; color: string; score: number };
type GameProps = { onHome: () => void };
type PhotoClue = { title: string; label: string };
type PhotoCard = { id: string; answer: string; category: string; clues: PhotoClue[]; explanation: string };

const colors = ['#45b6ff', '#ff70b5', '#a77bff', '#ffd45a'];

const cards: PhotoCard[] = [
  { id:'real-photo-01', answer:'عين شمس', category:'أماكن', clues:[{title:'Human_eye',label:'عين'},{title:'Sun',label:'شمس'}], explanation:'عين + شمس = عين شمس' },
  { id:'real-photo-02', answer:'رأس الخيمة', category:'أماكن', clues:[{title:'Human_head',label:'رأس'},{title:'Tent',label:'خيمة'}], explanation:'رأس + خيمة = رأس الخيمة' },
  { id:'real-photo-03', answer:'بيت البحر', category:'تركيب كلمات', clues:[{title:'House',label:'بيت'},{title:'Sea',label:'بحر'}], explanation:'بيت + بحر = بيت البحر' },
  { id:'real-photo-04', answer:'كرة القدم', category:'رياضة', clues:[{title:'Ball',label:'كرة'},{title:'Foot',label:'قدم'}], explanation:'كرة + قدم = كرة القدم' },
  { id:'real-photo-05', answer:'برج الساعة', category:'أماكن', clues:[{title:'Tower',label:'برج'},{title:'Clock',label:'ساعة'}], explanation:'برج + ساعة = برج الساعة' },
  { id:'real-photo-06', answer:'طريق الحرير', category:'تاريخ', clues:[{title:'Road',label:'طريق'},{title:'Silk',label:'حرير'}], explanation:'طريق + حرير = طريق الحرير' },
  { id:'real-photo-07', answer:'حصان طروادة', category:'تاريخ', clues:[{title:'Horse',label:'حصان'},{title:'Troy',label:'طروادة'}], explanation:'حصان + طروادة = حصان طروادة' },
  { id:'real-photo-08', answer:'البحر الأحمر', category:'جغرافيا', clues:[{title:'Sea',label:'بحر'},{title:'Red',label:'أحمر'}], explanation:'بحر + أحمر = البحر الأحمر' },
  { id:'real-photo-09', answer:'القمر الصناعي', category:'تقنية', clues:[{title:'Moon',label:'قمر'},{title:'Satellite',label:'صناعي'}], explanation:'قمر + صناعي = القمر الصناعي' },
  { id:'real-photo-10', answer:'كرة السلة', category:'رياضة', clues:[{title:'Ball',label:'كرة'},{title:'Basket',label:'سلة'}], explanation:'كرة + سلة = كرة السلة' },
  { id:'real-photo-11', answer:'مفتاح السيارة', category:'أشياء', clues:[{title:'Key',label:'مفتاح'},{title:'Car',label:'سيارة'}], explanation:'مفتاح + سيارة = مفتاح السيارة' },
  { id:'real-photo-12', answer:'باب البحر', category:'تركيب كلمات', clues:[{title:'Door',label:'باب'},{title:'Sea',label:'بحر'}], explanation:'باب + بحر = باب البحر' },
  { id:'real-photo-13', answer:'جبل طويق', category:'السعودية', clues:[{title:'Mountain',label:'جبل'},{title:'Tuwaiq',label:'طويق'}], explanation:'جبل + طويق = جبل طويق' },
  { id:'real-photo-14', answer:'نجم البحر', category:'طبيعة', clues:[{title:'Star',label:'نجم'},{title:'Sea',label:'بحر'}], explanation:'نجم + بحر = نجم البحر' },
  { id:'real-photo-15', answer:'حليب جوز الهند', category:'طعام', clues:[{title:'Milk',label:'حليب'},{title:'Coconut',label:'جوز الهند'}], explanation:'حليب + جوز الهند = حليب جوز الهند' },
  { id:'real-photo-16', answer:'كأس العالم', category:'رياضة', clues:[{title:'Trophy',label:'كأس'},{title:'Earth',label:'العالم'}], explanation:'كأس + العالم = كأس العالم' },
  { id:'real-photo-17', answer:'ساعة الرمل', category:'أشياء', clues:[{title:'Clock',label:'ساعة'},{title:'Sand',label:'رمل'}], explanation:'ساعة + رمل = ساعة الرمل' },
  { id:'real-photo-18', answer:'ماء الورد', category:'أشياء', clues:[{title:'Water',label:'ماء'},{title:'Rose',label:'ورد'}], explanation:'ماء + ورد = ماء الورد' },
  { id:'real-photo-19', answer:'حجر القمر', category:'طبيعة', clues:[{title:'Rock',label:'حجر'},{title:'Moon',label:'قمر'}], explanation:'حجر + قمر = حجر القمر' },
  { id:'real-photo-20', answer:'شجرة العائلة', category:'عائلة', clues:[{title:'Tree',label:'شجرة'},{title:'Family',label:'عائلة'}], explanation:'شجرة + عائلة = شجرة العائلة' },
];

const imageCache = new Map<string,string>();
async function fetchWikiImage(title: string): Promise<string> {
  if (imageCache.has(title)) return imageCache.get(title)!;
  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('image lookup failed');
  const data = await response.json() as { thumbnail?: { source?: string }; originalimage?: { source?: string } };
  const url = data.thumbnail?.source || data.originalimage?.source;
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

function RealClueImage({ clue, blurred }: { clue: PhotoClue; blurred: boolean }) {
  const [src,setSrc]=useState('');
  const [failed,setFailed]=useState(false);
  useEffect(()=>{let live=true;setSrc('');setFailed(false);void fetchWikiImage(clue.title).then(url=>{if(live)setSrc(url)}).catch(()=>{if(live)setFailed(true)});return()=>{live=false};},[clue.title]);
  return <div className={`real-photo-tile ${blurred?'is-blurred':''}`}>{src?<img src={src} alt="" referrerPolicy="no-referrer"/>:<div className="real-photo-loading">{failed?<ImageIcon/>:<RefreshCw className="spin"/>}</div>}<span>{clue.label}</span></div>;
}

export default function PhotoChallengeReal({ onHome }: GameProps) {
  const [teams,setTeams]=useState(initialTeams);
  const [seconds,setSeconds]=useNewGameNumber('photo','seconds',30);
  const [rounds,setRounds]=useNewGameNumber('photo','rounds',6);
  const [deck,setDeck]=useState(cards);
  const [round,setRound]=useState(0);
  const [level,setLevel]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [timedOut,setTimedOut]=useState(false);
  const [phase,setPhase]=useState<'setup'|'play'|'result'>('setup');
  const card=deck[round];
  const valid=teams.every(t=>t.name.trim())&&teams[0].name.trim()!==teams[1].name.trim();
  const winner=useMemo(()=>teams[0].score===teams[1].score?null:teams[0].score>teams[1].score?0:1,[teams]);
  const updateTeam=(index:number,patch:Partial<Team>)=>setTeams(current=>current.map((team,i)=>i===index?{...team,...patch}:team));
  const start=()=>{const prepared=teams.map(team=>({...team,name:team.name.trim(),score:0}));saveSharedTeams(prepared);setTeams(prepared);setDeck(drawWithoutRepeats('photos-real',cards,rounds,item=>item.id));setRound(0);setLevel(0);setRevealed(false);setTimedOut(false);setPhase('play');};
  const award=(team:number|null)=>{if(team!==null&&!timedOut)setTeams(value=>value.map((item,index)=>index===team?{...item,score:item.score+(3-level)*100}:item));if(round+1>=deck.length)setPhase('result');else{setRound(value=>value+1);setLevel(0);setRevealed(false);setTimedOut(false);}};

  return <section className="arena new-game photo-game real-photo-game">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={15}/> تحدي الصور</span><h1>{phase==='setup'?'صور حقيقية… واربطها صح.':phase==='result'?'وضح كل شيء!':`اللغز ${round+1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>
    {phase==='setup'?<div className="new-game-setup"><div className="section-heading"><h2>بنفس روح تحديات الصور الجماعية</h2><p>نعرض صورتين أو أكثر حقيقية، وأنتم تربطونها عشان تطلعون الكلمة أو العبارة. المحتوى أصلي داخل قدّها.</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor compact-team" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users/><span>0{index+1}</span></div><label>اسم الفريق {index===0?'الأول':'الثاني'}</label><input maxLength={22} value={team.name} onChange={event=>updateTeam(index,{name:event.target.value})}/><div className="color-choices">{colors.map(color=><button key={color} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>updateTeam(index,{color})}>{team.color===color?<Check size={16}/>:null}</button>)}</div></div>)}</div><div className="match-settings new-game-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة اللغز<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>عدد الألغاز<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={4}>4 ألغاز</option><option value={6}>6 ألغاز</option><option value={8}>8 ألغاز</option></select></label></div>{!valid?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:null}<div className="arena-actions"><span>الصور تُجلب من صفحات ويكيبيديا العامة وقت اللعب.</span><button className="primary" disabled={!valid} onClick={start}>ابدأوا التحدّي <Flag size={18}/></button></div></div>:phase==='result'?<div className="new-result"><Trophy/><span className="eyebrow">نهاية التحدي</span><h2>{winner===null?'تعادل… كلكم قدّها!':`${teams[winner].name}… قدّها!`}</h2><div className="new-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><b>{team.name}</b><strong>{team.score}</strong></span>)}</div><div className="result-actions"><button className="primary" onClick={start}><RotateCcw/> إعادة</button><button className="secondary" onClick={()=>setPhase('setup')}>تعديل الإعدادات</button></div></div>:<><div className="new-scorebar">{teams.map((team,index)=><div key={team.name} className={round%2===index?'active':''} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong></div>)}<p>الجولة <b>{round+1}</b> / {deck.length}</p></div><div className="new-stage real-photo-stage"><span className="game-chip">{card.category}</span><div className="real-photo-grid">{card.clues.map((clue,index)=><RealClueImage key={`${card.id}-${index}`} clue={clue} blurred={!revealed&&level===0}/>)}</div><p className="photo-points">قيمة الإجابة: <b>{timedOut?0:(3-level)*100}</b> نقطة</p><Countdown key={card.id} seconds={seconds} stopped={revealed} onExpire={()=>{setTimedOut(true);setRevealed(true);}}/>{!revealed?<div className="photo-actions"><button className="secondary" disabled={level===2} onClick={()=>setLevel(value=>Math.min(2,value+1))}><ImageIcon/> وضّح أكثر</button><button className="primary" onClick={()=>setRevealed(true)}><Eye/> كشف الإجابة</button></div>:<div className={`answer-feedback ${timedOut?'wrong':'correct'}`}><small>{timedOut?'انتهى الوقت · بلا نقاط':'الإجابة'}</small><h2>{card.answer}</h2><p>{card.explanation}</p><div className="judge-row">{timedOut?<button className="primary" onClick={()=>award(null)}>{round+1===deck.length?'عرض النتيجة':'اللغز التالي'}</button>:<>{teams.map((team,index)=><button key={team.name} style={{'--team':team.color} as CSSProperties} onClick={()=>award(index)}>{team.name} · +{(3-level)*100}</button>)}<button onClick={()=>award(null)}>لا أحد</button></>}</div></div>}</div></>}
  </section>;
}
