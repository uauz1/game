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

const cards: PhotoCard[] = [
  {id:'sound-01',answer:'دبي',category:'مدن',clues:[{title:'Brown_bear',revealLabel:'دب'},{title:'Bee',revealLabel:'bee / بي'}],hints:['مدينة خليجية','جرّب عربي + إنجليزي'],explanation:'دب + bee (بي) = دبي'},
  {id:'sound-02',answer:'تبوك',category:'السعودية',clues:[{title:'Tea',revealLabel:'tea / تي'},{title:'Book',revealLabel:'book / بوك'}],hints:['مدينة سعودية','اقرأ الصورتين بالإنجليزي'],explanation:'tea + book = تبوك'},
  {id:'sound-03',answer:'عُمان',category:'دول',clues:[{title:'O',revealLabel:'O / أو'},{title:'Man',revealLabel:'man / مان'}],hints:['دولة خليجية','حرف إنجليزي + شخص'],explanation:'O + man = عُمان'},
  {id:'sound-04',answer:'اليمن',category:'دول',clues:[{title:'Y',revealLabel:'Y / واي'},{title:'Man',revealLabel:'men / مِن'}],hints:['دولة عربية','الحرف الأول إنجليزي'],explanation:'Y + men ≈ اليمن'},
  {id:'sound-05',answer:'البحرين',category:'دول',clues:[{title:'Sea',revealLabel:'بحر'},{title:'Rain',revealLabel:'rain / رين'}],hints:['دولة خليجية','الأولى بالعربي والثانية بالإنجليزي'],explanation:'بحر + rain = بحرين'},
  {id:'sound-06',answer:'المغرب',category:'دول',clues:[{title:'Mug',revealLabel:'mug / مَغ'},{title:'Rib',revealLabel:'rib / رِب'}],hints:['دولة عربية','اقرأ الصورتين بالإنجليزي بسرعة'],explanation:'mug + rib ≈ المغرب'},
  {id:'sound-07',answer:'الهند',category:'دول',clues:[{title:'Chicken',revealLabel:'hen / هِن'},{title:'D',revealLabel:'D / دي'}],hints:['دولة آسيوية','طائر + حرف'],explanation:'hen + D = هندي ≈ الهند'},
  {id:'sound-08',answer:'إيران',category:'دول',clues:[{title:'Ear',revealLabel:'ear / إير'},{title:'N',revealLabel:'N / إن'}],hints:['دولة آسيوية','عضو جسم + حرف'],explanation:'ear + N ≈ إيران'},
  {id:'sound-09',answer:'سوريا',category:'دول',clues:[{title:'Pain',revealLabel:'sore / سور'},{title:'A',revealLabel:'A / يا-أ'}],hints:['دولة عربية','المعنى الأول: مؤلم'],explanation:'sore + A ≈ سوريا'},
  {id:'sound-10',answer:'اليابان',category:'دول',clues:[{title:'Y',revealLabel:'Y / واي'},{title:'Frying_pan',revealLabel:'pan / بان'}],hints:['دولة آسيوية','حرف + أداة مطبخ'],explanation:'Y + pan ≈ يابان'},
  {id:'sound-11',answer:'كوريا',category:'دول',clues:[{title:'Core',revealLabel:'core / كور'},{title:'A',revealLabel:'A / يا-أ'}],hints:['دولة آسيوية','اقرأ الأولى بالإنجليزي'],explanation:'core + A ≈ كوريا'},
  {id:'sound-12',answer:'تركيا',category:'دول',clues:[{title:'Turkey_(bird)',revealLabel:'turkey / تركي'},{title:'A',revealLabel:'A / ا'}],hints:['دولة بين آسيا وأوروبا','طائر بالإنجليزي + حرف'],explanation:'turkey + A ≈ تركيا'},
  {id:'sound-13',answer:'تايلند',category:'دول',clues:[{title:'Necktie',revealLabel:'tie / تاي'},{title:'Land',revealLabel:'land / لند'}],hints:['دولة آسيوية سياحية','قطعة ملابس + أرض بالإنجليزي'],explanation:'tie + land = تايلند'},
  {id:'sound-14',answer:'آيسلندا',category:'دول',clues:[{title:'Ice',revealLabel:'ice / آيس'},{title:'Land',revealLabel:'land / لند'},{title:'A',revealLabel:'A / ا'}],hints:['دولة أوروبية باردة','ثلاث قطع صوتية'],explanation:'ice + land + A = آيسلندا'},
  {id:'sound-15',answer:'أيرلندا',category:'دول',clues:[{title:'Air',revealLabel:'air / أير'},{title:'Land',revealLabel:'land / لند'},{title:'A',revealLabel:'A / ا'}],hints:['جزيرة أوروبية','هواء + أرض + حرف'],explanation:'air + land + A = أيرلندا'},
  {id:'sound-16',answer:'فنلندا',category:'دول',clues:[{title:'Fan_(machine)',revealLabel:'fan / فَن'},{title:'Land',revealLabel:'land / لند'},{title:'A',revealLabel:'A / ا'}],hints:['دولة شمال أوروبا','جهاز هواء + أرض + حرف'],explanation:'fan + land + A ≈ فنلندا'},
  {id:'sound-17',answer:'بولندا',category:'دول',clues:[{title:'Bowl',revealLabel:'bowl / بول'},{title:'Land',revealLabel:'land / لند'},{title:'A',revealLabel:'A / ا'}],hints:['دولة أوروبية','وعاء + أرض + حرف'],explanation:'bowl + land + A ≈ بولندا'},
  {id:'sound-18',answer:'رومانيا',category:'دول',clues:[{title:'Room',revealLabel:'room / روم'},{title:'Man',revealLabel:'man / مان'},{title:'A',revealLabel:'A / يا-أ'}],hints:['دولة أوروبية','غرفة + رجل + حرف'],explanation:'room + man + A ≈ رومانيا'},
  {id:'sound-19',answer:'البرازيل',category:'دول',clues:[{title:'Bra',revealLabel:'bra / برا'},{title:'Z',revealLabel:'Z / زي'},{title:'L',revealLabel:'L / إل'}],hints:['دولة في أمريكا الجنوبية','قطعة ملابس + حرفين'],explanation:'bra + Z + L ≈ برازيل'},
  {id:'sound-20',answer:'الأرجنتين',category:'دول',clues:[{title:'R',revealLabel:'R / آر'},{title:'Gin',revealLabel:'gin / جِن'},{title:'Teenager',revealLabel:'teen / تين'}],hints:['دولة في أمريكا الجنوبية','حرف + مقطعان إنجليزيان'],explanation:'R + gin + teen ≈ أرجنتين'},
  {id:'sound-21',answer:'باريس',category:'مدن',clues:[{title:'Bar_(establishment)',revealLabel:'bar / بار'},{title:'Rice',revealLabel:'rice / رايس'}],hints:['عاصمة أوروبية','مكان + طعام بالإنجليزي'],explanation:'bar + rice ≈ باريس'},
  {id:'sound-22',answer:'روما',category:'مدن',clues:[{title:'Room',revealLabel:'room / روم'},{title:'A',revealLabel:'A / ا'}],hints:['عاصمة أوروبية','غرفة + حرف'],explanation:'room + A = روما'},
  {id:'sound-23',answer:'مدريد',category:'مدن',clues:[{title:'Anger',revealLabel:'mad / ماد'},{title:'Reading',revealLabel:'read / ريد'}],hints:['عاصمة أوروبية','غاضب + اقرأ بالإنجليزي'],explanation:'mad + read ≈ مدريد'},
  {id:'sound-24',answer:'الدمام',category:'السعودية',clues:[{title:'Blood',revealLabel:'دم'},{title:'Mother',revealLabel:'mom / مام'}],hints:['مدينة سعودية','الأولى بالعربي والثانية بالإنجليزي'],explanation:'دم + mom = دمام'},
  {id:'sound-25',answer:'بيشة',category:'السعودية',clues:[{title:'Bee',revealLabel:'bee / بي'},{title:'Woman',revealLabel:'she / شي'}],hints:['مدينة سعودية','حشرة + ضمير إنجليزي'],explanation:'bee + she ≈ بيشة'},
  {id:'sound-26',answer:'رأس الخيمة',category:'أماكن',clues:[{title:'Human_head',revealLabel:'رأس'},{title:'Tent',revealLabel:'خيمة'}],hints:['إمارة خليجية','هذه المرة اقرأها بالعربي حرفيًا'],explanation:'رأس + خيمة = رأس الخيمة'},
  {id:'sound-27',answer:'أبوظبي',category:'مدن',clues:[{title:'Father',revealLabel:'أبو'},{title:'Gazelle',revealLabel:'ظبي'}],hints:['عاصمة خليجية','الصورتان عربيتان مباشرتان'],explanation:'أبو + ظبي = أبوظبي'},
  {id:'sound-28',answer:'ليفربول',category:'كرة قدم',clues:[{title:'Liver',revealLabel:'liver / ليفر'},{title:'Swimming_pool',revealLabel:'pool / بول'}],hints:['نادي ومدينة إنجليزية','عضو جسم + مسبح بالإنجليزي'],explanation:'liver + pool = ليفربول'},
  {id:'sound-29',answer:'مانشستر',category:'كرة قدم',clues:[{title:'Man',revealLabel:'man / مان'},{title:'Chest',revealLabel:'chest / شِست'},{title:'R',revealLabel:'R / آر'}],hints:['مدينة إنجليزية شهيرة بكرة القدم','رجل + صدر + حرف'],explanation:'man + chest + R ≈ مانشستر'},
  {id:'sound-30',answer:'ميلان',category:'كرة قدم',clues:[{title:'Meal',revealLabel:'meal / ميل'},{title:'N',revealLabel:'N / إن'}],hints:['مدينة ونادٍ إيطالي','وجبة + حرف'],explanation:'meal + N ≈ ميلان'},
  {id:'sound-31',answer:'هالاند',category:'كرة قدم',clues:[{title:'Hall',revealLabel:'hall / هال'},{title:'Land',revealLabel:'land / لاند'}],hints:['لاعب كرة قدم مشهور','قاعة + أرض بالإنجليزي'],explanation:'hall + land = هالاند'},
  {id:'sound-32',answer:'مبابي',category:'كرة قدم',clues:[{title:'Map',revealLabel:'map / ماب'},{title:'Baby',revealLabel:'baby / بيبي'}],hints:['لاعب كرة قدم مشهور','خريطة + طفل بالإنجليزي'],explanation:'map + baby ≈ مبابي'},
  {id:'sound-33',answer:'باتمان',category:'شخصيات',clues:[{title:'Bat',revealLabel:'bat / بات'},{title:'Man',revealLabel:'man / مان'}],hints:['شخصية خيالية شهيرة','حيوان + رجل بالإنجليزي'],explanation:'bat + man = باتمان'},
  {id:'sound-34',answer:'سوبرمان',category:'شخصيات',clues:[{title:'Soup',revealLabel:'soup / سوب'},{title:'R',revealLabel:'R / آر'},{title:'Man',revealLabel:'man / مان'}],hints:['شخصية خيالية شهيرة','حساء + حرف + رجل'],explanation:'soup + R + man ≈ سوبرمان'},
  {id:'sound-35',answer:'هاري بوتر',category:'شخصيات',clues:[{title:'Hair',revealLabel:'hair / هير'},{title:'Pottery',revealLabel:'potter / بوتر'}],hints:['شخصية خيالية شهيرة','شعر + صانع فخار بالإنجليزي'],explanation:'hair + potter ≈ هاري بوتر'},
  {id:'sound-36',answer:'فيسبوك',category:'تقنية',clues:[{title:'Human_face',revealLabel:'face / فيس'},{title:'Book',revealLabel:'book / بوك'}],hints:['منصة اجتماعية','وجه + كتاب بالإنجليزي'],explanation:'face + book = فيسبوك'},
  {id:'sound-37',answer:'يوتيوب',category:'تقنية',clues:[{title:'U',revealLabel:'U / يو'},{title:'Tube',revealLabel:'tube / تيوب'}],hints:['منصة فيديو','حرف + أنبوب بالإنجليزي'],explanation:'U + tube = يوتيوب'},
  {id:'sound-38',answer:'آيفون',category:'تقنية',clues:[{title:'Human_eye',revealLabel:'eye / آي'},{title:'Telephone',revealLabel:'phone / فون'}],hints:['جهاز مشهور','عين + هاتف بالإنجليزي'],explanation:'eye + phone = آيفون'},
  {id:'sound-39',answer:'آيباد',category:'تقنية',clues:[{title:'Human_eye',revealLabel:'eye / آي'},{title:'Notepad',revealLabel:'pad / باد'}],hints:['جهاز لوحي مشهور','عين + دفتر بالإنجليزي'],explanation:'eye + pad = آيباد'},
  {id:'sound-40',answer:'ماك بوك',category:'تقنية',clues:[{title:'Big_Mac',revealLabel:'Mac / ماك'},{title:'Book',revealLabel:'book / بوك'}],hints:['حاسوب محمول مشهور','وجبة + كتاب'],explanation:'Mac + book = ماك بوك'},
  {id:'sound-41',answer:'كتاب',category:'أشياء',clues:[{title:'Key',revealLabel:'key / كي'},{title:'Tab_(interface)',revealLabel:'tab / تاب'}],hints:['شيء نقرأه','مفتاح + تبويب بالإنجليزي'],explanation:'key + tab ≈ كتاب'},
  {id:'sound-42',answer:'قطار',category:'مواصلات',clues:[{title:'Cat',revealLabel:'قط / cat'},{title:'R',revealLabel:'R / آر'}],hints:['وسيلة نقل','حيوان + حرف'],explanation:'قط + R = قطار'},
  {id:'sound-43',answer:'بنك',category:'أماكن',clues:[{title:'Bean',revealLabel:'bean / بِن'},{title:'K',revealLabel:'K / كِ'}],hints:['مكان مرتبط بالمال','حبّة + حرف'],explanation:'bean + K ≈ بنك'},
  {id:'sound-44',answer:'طاولة',category:'أشياء',clues:[{title:'Towel',revealLabel:'towel / تاول'},{title:'A',revealLabel:'A / ا'}],hints:['قطعة أثاث','منشفة + حرف'],explanation:'towel + A ≈ طاولة'},
  {id:'sound-45',answer:'ساعة',category:'أشياء',clues:[{title:'Saw',revealLabel:'saw / ساو'},{title:'A',revealLabel:'A / ا'}],hints:['تقيس الوقت','أداة قطع + حرف'],explanation:'saw + A ≈ ساعة'},
  {id:'sound-46',answer:'سكين',category:'أشياء',clues:[{title:'Ski',revealLabel:'ski / سكي'},{title:'N',revealLabel:'N / إن'}],hints:['أداة مطبخ','رياضة ثلجية + حرف'],explanation:'ski + N = سكين'},
  {id:'sound-47',answer:'كيك',category:'طعام',clues:[{title:'Key',revealLabel:'key / كي'},{title:'K',revealLabel:'K / كِ'}],hints:['حلى معروف','مفتاح + حرف'],explanation:'key + K = كيك'},
  {id:'sound-48',answer:'بسكوت',category:'طعام',clues:[{title:'Bus',revealLabel:'bus / بس'},{title:'Coat',revealLabel:'coat / كوت'}],hints:['سناك وحلى','حافلة + معطف بالإنجليزي'],explanation:'bus + coat ≈ بسكوت'},
  {id:'sound-49',answer:'كاتشب',category:'طعام',clues:[{title:'Cat',revealLabel:'cat / كات'},{title:'Ship',revealLabel:'ship / شِب'}],hints:['صلصة مشهورة','قطة + سفينة بالإنجليزي'],explanation:'cat + ship ≈ كاتشب'},
  {id:'sound-50',answer:'سمبوسة',category:'طعام',clues:[{title:'Summation',revealLabel:'sum / سَم'},{title:'Bus',revealLabel:'bus / بُس'},{title:'A',revealLabel:'A / ا'}],hints:['مقبلات مشهورة','عملية حسابية + حافلة + حرف'],explanation:'sum + bus + A ≈ سمبوسة'},
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
  } catch {/* fall through to search */}

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
  const points=Math.max(100,300-hintLevel*100);
  const updateTeam=(index:number,patch:Partial<Team>)=>setTeams(current=>current.map((team,i)=>i===index?{...team,...patch}:team));
  const start=()=>{const prepared=teams.map(team=>({...team,name:team.name.trim(),score:0}));saveSharedTeams(prepared);setTeams(prepared);setDeck(drawWithoutRepeats('photos-sound-v5',cards,rounds,item=>item.id));setRound(0);setHintLevel(0);setRevealed(false);setTimedOut(false);setPhase('play');};
  const award=(team:number|null)=>{if(team!==null&&!timedOut)setTeams(value=>value.map((item,index)=>index===team?{...item,score:item.score+points}:item));if(round+1>=deck.length)setPhase('result');else{setRound(value=>value+1);setHintLevel(0);setRevealed(false);setTimedOut(false);}};

  useEffect(()=>{
    if(phase!=='play')return;
    const next=deck[round+1];
    if(!next)return;
    next.clues.filter(clue=>!isLetterClue(clue.title)).forEach(clue=>{void fetchWikiImage(clue.title).catch(()=>undefined);});
  },[deck,phase,round]);

  return <section className="arena new-game photo-game real-photo-game">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={15}/> تحدي الصور</span><h1>{phase==='setup'?'اقرأ الصور… ثم اسمع الكلمة.':phase==='result'?'خلص التحدّي!':`اللغز ${round+1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>
    {phase==='setup'?<div className="new-game-setup"><div className="section-heading"><h2>الصورة قد تُقرأ عربي… أو إنجليزي</h2><p>هنا الربط صوتي وذكي: صورة ممكن تعني كلمة عربية، أو نقرأ اسمها بالإنجليزي، أو تكون حرفًا. اجمع أصوات الصور بالترتيب لين تسمع الإجابة. ما فيه تغبيش، ولا صور حشو.</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor compact-team" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users/><span>0{index+1}</span></div><label>اسم الفريق {index===0?'الأول':'الثاني'}</label><input maxLength={22} value={team.name} onChange={event=>updateTeam(index,{name:event.target.value})}/><div className="color-choices">{colors.map(color=><button key={color} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>updateTeam(index,{color})}>{team.color===color?<Check size={16}/>:null}</button>)}</div></div>)}</div><div className="match-settings new-game-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة اللغز<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>عدد الألغاز<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={4}>4 ألغاز</option><option value={6}>6 ألغاز</option><option value={8}>8 ألغاز</option></select></label></div>{!valid?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:null}<div className="arena-actions"><span>مثال الفكرة: tea + book = تبوك، liver + pool = ليفربول.</span><button className="primary" disabled={!valid} onClick={start}>ابدأوا التحدّي <Flag size={18}/></button></div></div>:phase==='result'?<div className="new-result"><Trophy/><span className="eyebrow">نهاية التحدي</span><h2>{winner===null?'تعادل… كلكم قدّها!':`${teams[winner].name}… قدّها!`}</h2><div className="new-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><b>{team.name}</b><strong>{team.score}</strong></span>)}</div><div className="result-actions"><button className="primary" onClick={start}><RotateCcw/> إعادة</button><button className="secondary" onClick={()=>setPhase('setup')}>تعديل الإعدادات</button></div></div>:<><div className="new-scorebar">{teams.map((team,index)=><div key={team.name} className={round%2===index?'active':''} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong></div>)}<p>الجولة <b>{round+1}</b> / {deck.length}</p></div><div className="new-stage real-photo-stage"><span className="game-chip">{card.category}</span><div className="real-photo-equation"><div className="real-photo-grid">{card.clues.map((clue,index)=><div className="real-photo-piece" key={`${card.id}-${index}`}><RealClueImage clue={clue} revealed={revealed}/>{index<card.clues.length-1?<b className="photo-plus" aria-hidden="true">+</b>:null}</div>)}</div><span className="photo-equals" aria-hidden="true">= ?</span></div>{hintLevel>0&&!revealed?<div className="photo-hints">{card.hints.slice(0,hintLevel).map((hint,index)=><p key={hint}><Lightbulb size={16}/><b>تلميح {index+1}</b><span>{hint}</span></p>)}</div>:null}<p className="photo-points">قيمة الإجابة: <b>{timedOut?0:points}</b> نقطة</p><Countdown key={card.id} seconds={seconds} stopped={revealed} onExpire={()=>{setTimedOut(true);setRevealed(true);}}/>{!revealed?<div className="photo-actions"><button className="secondary" disabled={hintLevel===card.hints.length} onClick={()=>setHintLevel(value=>Math.min(card.hints.length,value+1))}><Lightbulb/> تلميح · نقاط أقل</button><button className="primary" onClick={()=>setRevealed(true)}><Eye/> كشف الإجابة</button></div>:<div className={`answer-feedback ${timedOut?'wrong':'correct'}`}><small>{timedOut?'انتهى الوقت · بلا نقاط':'الإجابة'}</small><h2>{card.answer}</h2><p>{card.explanation}</p><div className="judge-row">{timedOut?<button className="primary" onClick={()=>award(null)}>{round+1===deck.length?'عرض النتيجة':'اللغز التالي'}</button>:<>{teams.map((team,index)=><button key={team.name} style={{'--team':team.color} as CSSProperties} onClick={()=>award(index)}>{team.name} · +{points}</button>)}<button onClick={()=>award(null)}>لا أحد</button></>}</div></div>}</div></>}
  </section>;
}
