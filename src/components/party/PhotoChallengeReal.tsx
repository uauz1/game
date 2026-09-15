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
type Difficulty = 'سهل' | 'متوسط' | 'صعب';
type PhotoClue = { title: string; revealLabel: string };
type PhotoCard = { id: string; answer: string; category: string; difficulty: Difficulty; clues: PhotoClue[]; hints: [string, string]; explanation: string };

const colors = ['#45b6ff', '#ff70b5', '#a77bff', '#ffd45a'];

// Curated rule: every clue must contribute a clear Arabic word, English sound, or visible letter.
// Weak/forced phonetic links are deliberately excluded.
const cards: PhotoCard[] = [
  {id:'photo-q-01',answer:'دبي',category:'مدن',difficulty:'سهل',clues:[{title:'Brown_bear',revealLabel:'دب'},{title:'Bee',revealLabel:'bee / بي'}],hints:['مدينة خليجية','عربي + إنجليزي'],explanation:'دب + bee (بي) = دبي'},
  {id:'photo-q-02',answer:'تبوك',category:'السعودية',difficulty:'سهل',clues:[{title:'Tea',revealLabel:'tea / تي'},{title:'Book',revealLabel:'book / بوك'}],hints:['مدينة سعودية','اقرأ الصورتين بالإنجليزي'],explanation:'tea + book = تبوك'},
  {id:'photo-q-03',answer:'عُمان',category:'دول',difficulty:'سهل',clues:[{title:'O',revealLabel:'O / أو'},{title:'Man',revealLabel:'man / مان'}],hints:['دولة خليجية','حرف + رجل بالإنجليزي'],explanation:'O + man = عُمان'},
  {id:'photo-q-04',answer:'البحرين',category:'دول',difficulty:'متوسط',clues:[{title:'Sea',revealLabel:'بحر'},{title:'Rain',revealLabel:'rain / رين'}],hints:['دولة خليجية','الأولى بالعربي والثانية بالإنجليزي'],explanation:'بحر + rain = بحرين'},
  {id:'photo-q-05',answer:'تايلند',category:'دول',difficulty:'سهل',clues:[{title:'Necktie',revealLabel:'tie / تاي'},{title:'Land',revealLabel:'land / لاند'}],hints:['دولة آسيوية','قطعة ملابس + أرض'],explanation:'tie + land = تايلند'},
  {id:'photo-q-06',answer:'آيسلندا',category:'دول',difficulty:'متوسط',clues:[{title:'Ice',revealLabel:'ice / آيس'},{title:'Land',revealLabel:'land / لاند'},{title:'A',revealLabel:'A / ا'}],hints:['دولة أوروبية باردة','ثلاث قطع صوتية'],explanation:'ice + land + A = آيسلندا'},
  {id:'photo-q-07',answer:'أيرلندا',category:'دول',difficulty:'متوسط',clues:[{title:'Air',revealLabel:'air / أير'},{title:'Land',revealLabel:'land / لاند'},{title:'A',revealLabel:'A / ا'}],hints:['جزيرة أوروبية','هواء + أرض + حرف'],explanation:'air + land + A = أيرلندا'},
  {id:'photo-q-08',answer:'بولندا',category:'دول',difficulty:'صعب',clues:[{title:'Bowl',revealLabel:'bowl / بول'},{title:'Land',revealLabel:'land / لاند'},{title:'A',revealLabel:'A / ا'}],hints:['دولة أوروبية','وعاء + أرض + حرف'],explanation:'bowl + land + A ≈ بولندا'},
  {id:'photo-q-09',answer:'الدمام',category:'السعودية',difficulty:'سهل',clues:[{title:'Blood',revealLabel:'دم'},{title:'Mother',revealLabel:'mom / مام'}],hints:['مدينة سعودية','عربي + إنجليزي'],explanation:'دم + mom = الدمام'},
  {id:'photo-q-10',answer:'بيشة',category:'السعودية',difficulty:'متوسط',clues:[{title:'Bee',revealLabel:'bee / بي'},{title:'Woman',revealLabel:'she / شي'}],hints:['مدينة سعودية','حشرة + ضمير إنجليزي'],explanation:'bee + she ≈ بيشة'},
  {id:'photo-q-11',answer:'رأس الخيمة',category:'أماكن',difficulty:'سهل',clues:[{title:'Human_head',revealLabel:'رأس'},{title:'Tent',revealLabel:'خيمة'}],hints:['إمارة خليجية','الصورتان عربيتان مباشرتان'],explanation:'رأس + خيمة = رأس الخيمة'},
  {id:'photo-q-12',answer:'أبوظبي',category:'مدن',difficulty:'سهل',clues:[{title:'Father',revealLabel:'أبو'},{title:'Gazelle',revealLabel:'ظبي'}],hints:['عاصمة خليجية','الصورتان بالعربي'],explanation:'أبو + ظبي = أبوظبي'},
  {id:'photo-q-13',answer:'ليفربول',category:'كرة قدم',difficulty:'سهل',clues:[{title:'Liver',revealLabel:'liver / ليفر'},{title:'Swimming_pool',revealLabel:'pool / بول'}],hints:['مدينة ونادٍ إنجليزي','عضو جسم + مسبح'],explanation:'liver + pool = ليفربول'},
  {id:'photo-q-14',answer:'مانشستر',category:'كرة قدم',difficulty:'صعب',clues:[{title:'Man',revealLabel:'man / مان'},{title:'Chest',revealLabel:'chest / شِست'},{title:'R',revealLabel:'R / آر'}],hints:['مدينة إنجليزية مشهورة بكرة القدم','رجل + صدر + حرف'],explanation:'man + chest + R ≈ مانشستر'},
  {id:'photo-q-15',answer:'ميلان',category:'كرة قدم',difficulty:'متوسط',clues:[{title:'Meal',revealLabel:'meal / ميل'},{title:'N',revealLabel:'N / إن'}],hints:['مدينة ونادٍ إيطالي','وجبة + حرف'],explanation:'meal + N ≈ ميلان'},
  {id:'photo-q-16',answer:'هالاند',category:'كرة قدم',difficulty:'سهل',clues:[{title:'Hall',revealLabel:'hall / هال'},{title:'Land',revealLabel:'land / لاند'}],hints:['لاعب كرة قدم مشهور','قاعة + أرض'],explanation:'hall + land = هالاند'},
  {id:'photo-q-17',answer:'باتمان',category:'شخصيات',difficulty:'سهل',clues:[{title:'Bat',revealLabel:'bat / بات'},{title:'Man',revealLabel:'man / مان'}],hints:['شخصية خيالية شهيرة','حيوان + رجل'],explanation:'bat + man = باتمان'},
  {id:'photo-q-18',answer:'سبايدرمان',category:'شخصيات',difficulty:'سهل',clues:[{title:'Spider',revealLabel:'spider / سبايدر'},{title:'Man',revealLabel:'man / مان'}],hints:['شخصية خيالية شهيرة','حشرة + رجل بالإنجليزي'],explanation:'spider + man = سبايدرمان'},
  {id:'photo-q-19',answer:'سوبرمان',category:'شخصيات',difficulty:'متوسط',clues:[{title:'Soup',revealLabel:'soup / سوب'},{title:'R',revealLabel:'R / آر'},{title:'Man',revealLabel:'man / مان'}],hints:['شخصية خيالية شهيرة','حساء + حرف + رجل'],explanation:'soup + R + man ≈ سوبرمان'},
  {id:'photo-q-20',answer:'هاري بوتر',category:'شخصيات',difficulty:'متوسط',clues:[{title:'Hair',revealLabel:'hair / هير'},{title:'Pottery',revealLabel:'potter / بوتر'}],hints:['شخصية خيالية شهيرة','شعر + فخار'],explanation:'hair + potter ≈ هاري بوتر'},
  {id:'photo-q-21',answer:'فيسبوك',category:'تقنية',difficulty:'سهل',clues:[{title:'Human_face',revealLabel:'face / فيس'},{title:'Book',revealLabel:'book / بوك'}],hints:['منصة اجتماعية','وجه + كتاب'],explanation:'face + book = فيسبوك'},
  {id:'photo-q-22',answer:'يوتيوب',category:'تقنية',difficulty:'سهل',clues:[{title:'U',revealLabel:'U / يو'},{title:'Tube',revealLabel:'tube / تيوب'}],hints:['منصة فيديو','حرف + أنبوب'],explanation:'U + tube = يوتيوب'},
  {id:'photo-q-23',answer:'آيفون',category:'تقنية',difficulty:'سهل',clues:[{title:'Human_eye',revealLabel:'eye / آي'},{title:'Telephone',revealLabel:'phone / فون'}],hints:['جهاز مشهور','عين + هاتف بالإنجليزي'],explanation:'eye + phone = آيفون'},
  {id:'photo-q-24',answer:'آيباد',category:'تقنية',difficulty:'سهل',clues:[{title:'Human_eye',revealLabel:'eye / آي'},{title:'Notepad',revealLabel:'pad / باد'}],hints:['جهاز لوحي مشهور','عين + دفتر'],explanation:'eye + pad = آيباد'},
  {id:'photo-q-25',answer:'ماك بوك',category:'تقنية',difficulty:'سهل',clues:[{title:'Big_Mac',revealLabel:'Mac / ماك'},{title:'Book',revealLabel:'book / بوك'}],hints:['حاسوب محمول مشهور','ماك + كتاب'],explanation:'Mac + book = ماك بوك'},
  {id:'photo-q-26',answer:'بلوتوث',category:'تقنية',difficulty:'سهل',clues:[{title:'Blue',revealLabel:'blue / بلو'},{title:'Tooth',revealLabel:'tooth / توث'}],hints:['تقنية اتصال لاسلكي','لون + سن بالإنجليزي'],explanation:'blue + tooth = بلوتوث'},
  {id:'photo-q-27',answer:'بلاك بيري',category:'تقنية',difficulty:'سهل',clues:[{title:'Black',revealLabel:'black / بلاك'},{title:'Berry',revealLabel:'berry / بيري'}],hints:['اسم علامة/هاتف شهير قديم','لون + ثمرة'],explanation:'black + berry = بلاك بيري'},
  {id:'photo-q-28',answer:'ريد بول',category:'علامات',difficulty:'سهل',clues:[{title:'Red',revealLabel:'red / ريد'},{title:'Bull',revealLabel:'bull / بول'}],hints:['اسم علامة مشهورة','لون + حيوان'],explanation:'red + bull = ريد بول'},
  {id:'photo-q-29',answer:'سكين',category:'أشياء',difficulty:'سهل',clues:[{title:'Ski',revealLabel:'ski / سكي'},{title:'N',revealLabel:'N / إن'}],hints:['أداة مطبخ','رياضة ثلجية + حرف'],explanation:'ski + N = سكين'},
  {id:'photo-q-30',answer:'كيك',category:'طعام',difficulty:'سهل',clues:[{title:'Key',revealLabel:'key / كي'},{title:'K',revealLabel:'K / كِ'}],hints:['حلى معروف','مفتاح + حرف'],explanation:'key + K = كيك'},
  {id:'photo-q-31',answer:'بسكوت',category:'طعام',difficulty:'متوسط',clues:[{title:'Bus',revealLabel:'bus / بس'},{title:'Coat',revealLabel:'coat / كوت'}],hints:['سناك معروف','حافلة + معطف'],explanation:'bus + coat ≈ بسكوت'},
  {id:'photo-q-32',answer:'كاتشب',category:'طعام',difficulty:'متوسط',clues:[{title:'Cat',revealLabel:'cat / كات'},{title:'Ship',revealLabel:'ship / شِب'}],hints:['صلصة مشهورة','قطة + سفينة'],explanation:'cat + ship ≈ كاتشب'},
];

const imageCache = new Map<string,string>();
const isLetterClue = (title:string) => /^[A-Z]$/.test(title);

async function fetchWikiImage(title: string): Promise<string> {
  if (imageCache.has(title)) return imageCache.get(title)!;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const response = await fetch(summaryUrl, { headers: { accept: 'application/json' } });
    if (response.ok) {
      const data = await response.json() as { thumbnail?: { source?: string }; originalimage?: { source?: string } };
      const direct = data.originalimage?.source || data.thumbnail?.source;
      if (direct) { imageCache.set(title,direct); return direct; }
    }
  } catch {/* continue */}

  const searchTitle = title.split('_').join(' ');
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTitle)}&gsrlimit=5&prop=pageimages&piprop=thumbnail|original&pithumbsize=960&format=json&origin=*`;
  const searchResponse = await fetch(searchUrl, { headers: { accept: 'application/json' } });
  if (!searchResponse.ok) throw new Error('image lookup failed');
  const searchData = await searchResponse.json() as { query?: { pages?: Record<string,{ thumbnail?:{source?:string}; original?:{source?:string} }> } };
  const pages = Object.values(searchData.query?.pages ?? {});
  const fallback = pages.map(page=>page.original?.source || page.thumbnail?.source).find((url): url is string => Boolean(url));
  if (!fallback) throw new Error('no image');
  imageCache.set(title,fallback);
  return fallback;
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
  const letter=isLetterClue(clue.title);
  useEffect(()=>{if(letter)return;let live=true;setSrc('');setFailed(false);void fetchWikiImage(clue.title).then(url=>{if(live)setSrc(url)}).catch(()=>{if(live)setFailed(true)});return()=>{live=false};},[clue.title,letter]);
  if(letter)return <div className="real-photo-tile real-photo-letter"><strong>{clue.title}</strong>{revealed?<span>{clue.revealLabel}</span>:null}</div>;
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
  const basePoints=card?.difficulty==='صعب'?400:card?.difficulty==='متوسط'?350:300;
  const points=Math.max(100,basePoints-hintLevel*100);
  const updateTeam=(index:number,patch:Partial<Team>)=>setTeams(current=>current.map((team,i)=>i===index?{...team,...patch}:team));
  const start=()=>{const prepared=teams.map(team=>({...team,name:team.name.trim(),score:0}));saveSharedTeams(prepared);setTeams(prepared);setDeck(drawWithoutRepeats('photos-sound-v6',cards,rounds,item=>item.id));setRound(0);setHintLevel(0);setRevealed(false);setTimedOut(false);setPhase('play');};
  const award=(team:number|null)=>{if(team!==null&&!timedOut)setTeams(value=>value.map((item,index)=>index===team?{...item,score:item.score+points}:item));if(round+1>=deck.length)setPhase('result');else{setRound(value=>value+1);setHintLevel(0);setRevealed(false);setTimedOut(false);}};

  useEffect(()=>{
    if(phase!=='play')return;
    const next=deck[round+1];
    if(!next)return;
    next.clues.filter(clue=>!isLetterClue(clue.title)).forEach(clue=>{void fetchWikiImage(clue.title).catch(()=>undefined);});
  },[deck,phase,round]);

  return <section className="arena new-game photo-game real-photo-game">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={15}/> تحدي الصور</span><h1>{phase==='setup'?'كل صورة لازم يكون لها دور في الحل.':phase==='result'?'خلص التحدّي!':`اللغز ${round+1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>
    {phase==='setup'?<div className="new-game-setup"><div className="section-heading"><h2>ربط واضح، مو تخمين عشوائي</h2><p>الصورة ممكن تُقرأ بالعربي، بالإنجليزي، أو كحرف. لكن كل قطعة لازم تضيف صوتًا واضحًا للإجابة. شلنا الألغاز اللي ربطها بعيد أو يحتاج تبرير زيادة.</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor compact-team" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users/><span>0{index+1}</span></div><label>اسم الفريق {index===0?'الأول':'الثاني'}</label><input maxLength={22} value={team.name} onChange={event=>updateTeam(index,{name:event.target.value})}/><div className="color-choices">{colors.map(color=><button key={color} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>updateTeam(index,{color})}>{team.color===color?<Check size={16}/>:null}</button>)}</div></div>)}</div><div className="match-settings new-game-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة اللغز<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>عدد الألغاز<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={4}>4 ألغاز</option><option value={6}>6 ألغاز</option><option value={8}>8 ألغاز</option></select></label></div>{!valid?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:null}<div className="arena-actions"><span>مثال واضح: tea + book = تبوك · blue + tooth = بلوتوث.</span><button className="primary" disabled={!valid} onClick={start}>ابدأوا التحدّي <Flag size={18}/></button></div></div>:phase==='result'?<div className="new-result"><Trophy/><span className="eyebrow">نهاية التحدي</span><h2>{winner===null?'تعادل… كلكم قدّها!':`${teams[winner].name}… قدّها!`}</h2><div className="new-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><b>{team.name}</b><strong>{team.score}</strong></span>)}</div><div className="result-actions"><button className="primary" onClick={start}><RotateCcw/> إعادة</button><button className="secondary" onClick={()=>setPhase('setup')}>تعديل الإعدادات</button></div></div>:<><div className="new-scorebar">{teams.map((team,index)=><div key={team.name} className={round%2===index?'active':''} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong></div>)}<p>الجولة <b>{round+1}</b> / {deck.length}</p></div><div className="new-stage real-photo-stage"><div className="photo-meta"><span className="game-chip">{card.category}</span><span className={`photo-difficulty difficulty-${card.difficulty}`}>{card.difficulty}</span></div><div className="real-photo-equation"><div className="real-photo-grid">{card.clues.map((clue,index)=><div className="real-photo-piece" key={`${card.id}-${index}`}><RealClueImage clue={clue} revealed={revealed}/>{index<card.clues.length-1?<b className="photo-plus" aria-hidden="true">+</b>:null}</div>)}</div><span className="photo-equals" aria-hidden="true">= ?</span></div>{hintLevel>0&&!revealed?<div className="photo-hints">{card.hints.slice(0,hintLevel).map((hint,index)=><p key={hint}><Lightbulb size={16}/><b>تلميح {index+1}</b><span>{hint}</span></p>)}</div>:null}<p className="photo-points">قيمة الإجابة: <b>{timedOut?0:points}</b> نقطة</p><Countdown key={card.id} seconds={seconds} stopped={revealed} onExpire={()=>{setTimedOut(true);setRevealed(true);}}/>{!revealed?<div className="photo-actions"><button className="secondary" disabled={hintLevel===card.hints.length} onClick={()=>setHintLevel(value=>Math.min(card.hints.length,value+1))}><Lightbulb/> تلميح · نقاط أقل</button><button className="primary" onClick={()=>setRevealed(true)}><Eye/> كشف الإجابة</button></div>:<div className={`answer-feedback ${timedOut?'wrong':'correct'}`}><small>{timedOut?'انتهى الوقت · بلا نقاط':'الإجابة'}</small><h2>{card.answer}</h2><p>{card.explanation}</p><div className="judge-row">{timedOut?<button className="primary" onClick={()=>award(null)}>{round+1===deck.length?'عرض النتيجة':'اللغز التالي'}</button>:<>{teams.map((team,index)=><button key={team.name} style={{'--team':team.color} as CSSProperties} onClick={()=>award(index)}>{team.name} · +{points}</button>)}<button onClick={()=>award(null)}>لا أحد</button></>}</div></div>}</div></>}
  </section>;
}
