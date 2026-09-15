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
type PhotoCard = { id: string; answer: string; category: string; clues: PhotoClue[]; hints: [string, string]; explanation: string };

const colors = ['#45b6ff', '#ff70b5', '#a77bff', '#ffd45a'];

// Each picture maps to an actual word/concept in the answer. No filler images, no random association.
const cards: PhotoCard[] = [
  {id:'rebus-01',answer:'كرة القدم',category:'رياضة',clues:[{title:'Ball',revealLabel:'كرة'},{title:'Foot',revealLabel:'قدم'}],hints:['رياضة جماعية مشهورة','الكلمتان ظاهرتان حرفيًا في الصور'],explanation:'كرة + قدم = كرة القدم'},
  {id:'rebus-02',answer:'كرة السلة',category:'رياضة',clues:[{title:'Ball',revealLabel:'كرة'},{title:'Basket',revealLabel:'سلة'}],hints:['رياضة تُسجّل فيها بالنقاط','الصورة الثانية هي هدف التسجيل'],explanation:'كرة + سلة = كرة السلة'},
  {id:'rebus-03',answer:'حصان البحر',category:'حيوانات',clues:[{title:'Horse',revealLabel:'حصان'},{title:'Sea',revealLabel:'بحر'}],hints:['كائن بحري صغير','اسم الكائن مركب من الصورتين'],explanation:'حصان + بحر = حصان البحر'},
  {id:'rebus-04',answer:'نجم البحر',category:'حيوانات',clues:[{title:'Star',revealLabel:'نجم'},{title:'Sea',revealLabel:'بحر'}],hints:['كائن يعيش في البحر','شكله يفسر الكلمة الأولى'],explanation:'نجم + بحر = نجم البحر'},
  {id:'rebus-05',answer:'أسد البحر',category:'حيوانات',clues:[{title:'Lion',revealLabel:'أسد'},{title:'Sea',revealLabel:'بحر'}],hints:['حيوان بحري','اسمه يجمع حيوانًا معروفًا ومكان عيشه'],explanation:'أسد + بحر = أسد البحر'},
  {id:'rebus-06',answer:'قلب الأسد',category:'تعبير',clues:[{title:'Heart',revealLabel:'قلب'},{title:'Lion',revealLabel:'أسد'}],hints:['تعبير عن الشجاعة','الصورة الثانية ملك الغابة'],explanation:'قلب + أسد = قلب الأسد'},
  {id:'rebus-07',answer:'بيت العنكبوت',category:'طبيعة',clues:[{title:'House',revealLabel:'بيت'},{title:'Spider',revealLabel:'عنكبوت'}],hints:['مكان يرتبط بحيوان صغير','الإجابة من كلمتين واضحتين'],explanation:'بيت + عنكبوت = بيت العنكبوت'},
  {id:'rebus-08',answer:'شبكة العنكبوت',category:'طبيعة',clues:[{title:'Net',revealLabel:'شبكة'},{title:'Spider',revealLabel:'عنكبوت'}],hints:['شيء يصنعه حيوان','الصورة الأولى تمثل ما يصنعه'],explanation:'شبكة + عنكبوت = شبكة العنكبوت'},
  {id:'rebus-09',answer:'عين الإبرة',category:'أشياء',clues:[{title:'Human_eye',revealLabel:'عين'},{title:'Sewing_needle',revealLabel:'إبرة'}],hints:['جزء صغير جدًا في أداة خياطة','الصورة الأولى اسم الجزء'],explanation:'عين + إبرة = عين الإبرة'},
  {id:'rebus-10',answer:'عنق الزجاجة',category:'تعبير',clues:[{title:'Human_neck',revealLabel:'عنق'},{title:'Bottle',revealLabel:'زجاجة'}],hints:['يُقال حرفيًا ومجازيًا','الكلمة الأولى جزء من الجسم'],explanation:'عنق + زجاجة = عنق الزجاجة'},
  {id:'rebus-11',answer:'لسان الحذاء',category:'أشياء',clues:[{title:'Tongue',revealLabel:'لسان'},{title:'Shoe',revealLabel:'حذاء'}],hints:['جزء في شيء نلبسه','الكلمة الأولى عضو في الفم'],explanation:'لسان + حذاء = لسان الحذاء'},
  {id:'rebus-12',answer:'سن الفيل',category:'أشياء',clues:[{title:'Tooth',revealLabel:'سن'},{title:'Elephant',revealLabel:'فيل'}],hints:['مادة/جزء اشتهر بها حيوان','الصورتان تعطيان الاسم مباشرة'],explanation:'سن + فيل = سن الفيل'},
  {id:'rebus-13',answer:'ذيل الحصان',category:'أشياء',clues:[{title:'Tail',revealLabel:'ذيل'},{title:'Horse',revealLabel:'حصان'}],hints:['قد يكون وصفًا لشكل معروف','الكلمتان حرفيًا في الصور'],explanation:'ذيل + حصان = ذيل الحصان'},
  {id:'rebus-14',answer:'رأس المال',category:'تعبير',clues:[{title:'Human_head',revealLabel:'رأس'},{title:'Money',revealLabel:'مال'}],hints:['مصطلح اقتصادي مشهور','لا تقرأ الصورة الثانية كعملة محددة'],explanation:'رأس + مال = رأس المال'},
  {id:'rebus-15',answer:'بيت شعر',category:'لعب كلمات',clues:[{title:'House',revealLabel:'بيت'},{title:'Hair',revealLabel:'شعر'}],hints:['له معنى لغوي مشهور غير الظاهر في الصور','الصورة الثانية قد تُقرأ بأكثر من معنى'],explanation:'بيت + شعر = بيت شعر'},
  {id:'rebus-16',answer:'عين الماء',category:'طبيعة',clues:[{title:'Human_eye',revealLabel:'عين'},{title:'Water',revealLabel:'ماء'}],hints:['مصدر طبيعي للمياه','الكلمة الأولى لها أكثر من معنى بالعربية'],explanation:'عين + ماء = عين الماء'},
  {id:'rebus-17',answer:'رأس الجبل',category:'طبيعة',clues:[{title:'Human_head',revealLabel:'رأس'},{title:'Mountain',revealLabel:'جبل'}],hints:['وصف لأعلى جزء في مكان مرتفع','الصورة الأولى تعني الأعلى'],explanation:'رأس + جبل = رأس الجبل'},
  {id:'rebus-18',answer:'وجه القمر',category:'تعبير',clues:[{title:'Human_face',revealLabel:'وجه'},{title:'Moon',revealLabel:'قمر'}],hints:['تعبير عربي من كلمتين','الكلمة الثانية تظهر ليلًا'],explanation:'وجه + قمر = وجه القمر'},
  {id:'rebus-19',answer:'كرة الثلج',category:'أشياء',clues:[{title:'Ball',revealLabel:'كرة'},{title:'Snow',revealLabel:'ثلج'}],hints:['تُصنع غالبًا في الشتاء','الصورتان تعطيان الاسم مباشرة'],explanation:'كرة + ثلج = كرة الثلج'},
  {id:'rebus-20',answer:'ماء الورد',category:'أشياء',clues:[{title:'Water',revealLabel:'ماء'},{title:'Rose',revealLabel:'ورد'}],hints:['يستخدم في الطعام والعطور','الإجابة مركبة مباشرة من الصورتين'],explanation:'ماء + ورد = ماء الورد'},
  {id:'rebus-21',answer:'كأس العالم',category:'رياضة',clues:[{title:'Trophy',revealLabel:'كأس'},{title:'Earth',revealLabel:'العالم'}],hints:['بطولة رياضية عالمية','الصورة الثانية ترمز للعالم كله'],explanation:'كأس + العالم = كأس العالم'},
  {id:'rebus-22',answer:'طريق الحرير',category:'تاريخ',clues:[{title:'Road',revealLabel:'طريق'},{title:'Silk',revealLabel:'حرير'}],hints:['مسار تجاري تاريخي مشهور','الصورتان تعطيان اسمه مباشرة'],explanation:'طريق + حرير = طريق الحرير'},
  {id:'rebus-23',answer:'ساعة الرمل',category:'أشياء',clues:[{title:'Clock',revealLabel:'ساعة'},{title:'Sand',revealLabel:'رمل'}],hints:['أداة لقياس الوقت','الصورة الثانية هي المادة داخلها'],explanation:'ساعة + رمل = ساعة الرمل'},
  {id:'rebus-24',answer:'مفتاح السيارة',category:'أشياء',clues:[{title:'Key',revealLabel:'مفتاح'},{title:'Car',revealLabel:'سيارة'}],hints:['شيء نحمله معنا','يُستخدم لفتح أو تشغيل شيء'],explanation:'مفتاح + سيارة = مفتاح السيارة'},
  {id:'rebus-25',answer:'تذكرة الطائرة',category:'سفر',clues:[{title:'Ticket',revealLabel:'تذكرة'},{title:'Airplane',revealLabel:'طائرة'}],hints:['تحتاجها قبل السفر','الإجابة من كلمتين واضحتين'],explanation:'تذكرة + طائرة = تذكرة الطائرة'},
  {id:'rebus-26',answer:'فرشاة الأسنان',category:'أشياء',clues:[{title:'Brush',revealLabel:'فرشاة'},{title:'Tooth',revealLabel:'أسنان'}],hints:['تستخدم يوميًا','الصورة الثانية تحدد استخدام الأولى'],explanation:'فرشاة + أسنان = فرشاة الأسنان'},
  {id:'rebus-27',answer:'نظارة شمسية',category:'أشياء',clues:[{title:'Eyeglasses',revealLabel:'نظارة'},{title:'Sun',revealLabel:'شمس'}],hints:['تُلبس خارج المنزل غالبًا','الصورة الثانية تحدد نوع الأولى'],explanation:'نظارة + شمس = نظارة شمسية'},
  {id:'rebus-28',answer:'ورق العنب',category:'طعام',clues:[{title:'Leaf',revealLabel:'ورق'},{title:'Grape',revealLabel:'عنب'}],hints:['طبق معروف','الصورة الأولى ليست ورقة كتابة'],explanation:'ورق + عنب = ورق العنب'},
  {id:'rebus-29',answer:'سفينة الصحراء',category:'تعبير',clues:[{title:'Ship',revealLabel:'سفينة'},{title:'Desert',revealLabel:'صحراء'}],hints:['لقب لحيوان معروف','الإجابة نفسها عبارة من الصورتين'],explanation:'سفينة + صحراء = سفينة الصحراء'},
  {id:'rebus-30',answer:'ملك الغابة',category:'تعبير',clues:[{title:'King',revealLabel:'ملك'},{title:'Forest',revealLabel:'غابة'}],hints:['لقب لحيوان مفترس','الصورتان تعطيان اللقب مباشرة'],explanation:'ملك + غابة = ملك الغابة'},
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
  const start=()=>{const prepared=teams.map(team=>({...team,name:team.name.trim(),score:0}));saveSharedTeams(prepared);setTeams(prepared);setDeck(drawWithoutRepeats('photos-real-v3',cards,rounds,item=>item.id));setRound(0);setHintLevel(0);setRevealed(false);setTimedOut(false);setPhase('play');};
  const award=(team:number|null)=>{if(team!==null&&!timedOut)setTeams(value=>value.map((item,index)=>index===team?{...item,score:item.score+points}:item));if(round+1>=deck.length)setPhase('result');else{setRound(value=>value+1);setHintLevel(0);setRevealed(false);setTimedOut(false);}};

  return <section className="arena new-game photo-game real-photo-game">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={15}/> تحدي الصور</span><h1>{phase==='setup'?'الصورتان نفسهما تصنعان الإجابة.':phase==='result'?'خلص التحدّي!':`اللغز ${round+1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>
    {phase==='setup'?<div className="new-game-setup"><div className="section-heading"><h2>اربط معنى الصور، مو شكلها</h2><p>كل صورة تمثل كلمة أو مفهومًا حقيقيًا داخل الإجابة. ما فيه صور حشو أو علاقات بعيدة: اقرأ الصورة الأولى، ثم الثانية، وركّب المعنى.</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor compact-team" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users/><span>0{index+1}</span></div><label>اسم الفريق {index===0?'الأول':'الثاني'}</label><input maxLength={22} value={team.name} onChange={event=>updateTeam(index,{name:event.target.value})}/><div className="color-choices">{colors.map(color=><button key={color} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>updateTeam(index,{color})}>{team.color===color?<Check size={16}/>:null}</button>)}</div></div>)}</div><div className="match-settings new-game-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة اللغز<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>عدد الألغاز<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={4}>4 ألغاز</option><option value={6}>6 ألغاز</option><option value={8}>8 ألغاز</option></select></label></div>{!valid?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:null}<div className="arena-actions"><span>الصور واضحة، والربط الآن مبني على كلمات فعلية داخل الحل.</span><button className="primary" disabled={!valid} onClick={start}>ابدأوا التحدّي <Flag size={18}/></button></div></div>:phase==='result'?<div className="new-result"><Trophy/><span className="eyebrow">نهاية التحدي</span><h2>{winner===null?'تعادل… كلكم قدّها!':`${teams[winner].name}… قدّها!`}</h2><div className="new-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><b>{team.name}</b><strong>{team.score}</strong></span>)}</div><div className="result-actions"><button className="primary" onClick={start}><RotateCcw/> إعادة</button><button className="secondary" onClick={()=>setPhase('setup')}>تعديل الإعدادات</button></div></div>:<><div className="new-scorebar">{teams.map((team,index)=><div key={team.name} className={round%2===index?'active':''} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong></div>)}<p>الجولة <b>{round+1}</b> / {deck.length}</p></div><div className="new-stage real-photo-stage"><span className="game-chip">{card.category}</span><div className="real-photo-equation"><div className="real-photo-grid">{card.clues.map((clue,index)=><div className="real-photo-piece" key={`${card.id}-${index}`}><RealClueImage clue={clue} revealed={revealed}/>{index<card.clues.length-1?<b className="photo-plus" aria-hidden="true">+</b>:null}</div>)}</div><span className="photo-equals" aria-hidden="true">= ?</span></div>{hintLevel>0&&!revealed?<div className="photo-hints">{card.hints.slice(0,hintLevel).map((hint,index)=><p key={hint}><Lightbulb size={16}/><b>تلميح {index+1}</b><span>{hint}</span></p>)}</div>:null}<p className="photo-points">قيمة الإجابة: <b>{timedOut?0:points}</b> نقطة</p><Countdown key={card.id} seconds={seconds} stopped={revealed} onExpire={()=>{setTimedOut(true);setRevealed(true);}}/>{!revealed?<div className="photo-actions"><button className="secondary" disabled={hintLevel===card.hints.length} onClick={()=>setHintLevel(value=>Math.min(card.hints.length,value+1))}><Lightbulb/> تلميح · نقاط أقل</button><button className="primary" onClick={()=>setRevealed(true)}><Eye/> كشف الإجابة</button></div>:<div className={`answer-feedback ${timedOut?'wrong':'correct'}`}><small>{timedOut?'انتهى الوقت · بلا نقاط':'الإجابة'}</small><h2>{card.answer}</h2><p>{card.explanation}</p><div className="judge-row">{timedOut?<button className="primary" onClick={()=>award(null)}>{round+1===deck.length?'عرض النتيجة':'اللغز التالي'}</button>:<>{teams.map((team,index)=><button key={team.name} style={{'--team':team.color} as CSSProperties} onClick={()=>award(index)}>{team.name} · +{points}</button>)}<button onClick={()=>award(null)}>لا أحد</button></>}</div></div>}</div></>}
  </section>;
}
