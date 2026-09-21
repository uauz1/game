import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Brain, Check, ChevronLeft, Clock3, Flame, RefreshCw, RotateCcw, ShieldQuestion, Sparkles, Trophy, X, Zap } from 'lucide-react';
import { clearMultiplayerChallenge, publishMultiplayerChallenge, publishMultiplayerTeamNames } from '../../utils/multiplayerSession';
import { readQaddhaPreferences } from '../../utils/sitePreferences';

type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
type Team = { name: string; score: number };

type PressurePrompt = {
  id: string;
  difficulty: Exclude<Difficulty, 'mixed'>;
  category: string;
  text: string;
  target: number;
  seconds: number;
};

type IntruderRound = {
  id: string;
  difficulty: Exclude<Difficulty, 'mixed'>;
  category: string;
  items: [string, string, string, string];
  answer: number;
  explanation: string;
};

const PRESSURE_PROMPTS: PressurePrompt[] = [
  {id:'p-e-01',difficulty:'easy',category:'حولك',text:'اذكر أشياء تلقاها عادة في المطبخ',target:5,seconds:15},
  {id:'p-e-02',difficulty:'easy',category:'رياضة',text:'اذكر رياضات تُلعب بالكرة',target:5,seconds:15},
  {id:'p-e-03',difficulty:'easy',category:'سفر',text:'اذكر أشياء تأخذها معك في السفر',target:5,seconds:15},
  {id:'p-e-04',difficulty:'easy',category:'مدن',text:'اذكر مدنًا سعودية',target:5,seconds:15},
  {id:'p-e-05',difficulty:'easy',category:'أكل',text:'اذكر فواكه لونها أحمر أو قريب من الأحمر',target:4,seconds:15},
  {id:'p-e-06',difficulty:'easy',category:'تقنية',text:'اذكر تطبيقات تستخدمها للتواصل',target:4,seconds:15},
  {id:'p-e-07',difficulty:'easy',category:'حيوانات',text:'اذكر حيوانات تبدأ بحرف الألف أو الباء أو التاء',target:4,seconds:15},
  {id:'p-e-08',difficulty:'easy',category:'منزل',text:'اذكر أشياء فيها شاشة',target:5,seconds:15},
  {id:'p-m-01',difficulty:'medium',category:'جغرافيا',text:'اذكر دولًا عربية في قارة أفريقيا',target:6,seconds:15},
  {id:'p-m-02',difficulty:'medium',category:'كرة قدم',text:'اذكر أندية سبق أن فازت بدوري أبطال أوروبا',target:6,seconds:15},
  {id:'p-m-03',difficulty:'medium',category:'علوم',text:'اذكر أعضاء أو أجهزة في جسم الإنسان',target:7,seconds:15},
  {id:'p-m-04',difficulty:'medium',category:'ثقافة',text:'اذكر أعمالًا أدبية أو روائية عربية معروفة',target:5,seconds:18},
  {id:'p-m-05',difficulty:'medium',category:'سيارات',text:'اذكر شركات سيارات يابانية أو كورية',target:6,seconds:15},
  {id:'p-m-06',difficulty:'medium',category:'تاريخ',text:'اذكر حضارات أو إمبراطوريات قديمة',target:6,seconds:18},
  {id:'p-m-07',difficulty:'medium',category:'لغة',text:'اذكر كلمات عربية من خمسة أحرف تبدأ بحرف الميم',target:5,seconds:18},
  {id:'p-m-08',difficulty:'medium',category:'سعودية',text:'اذكر مناطق إدارية في المملكة العربية السعودية',target:7,seconds:18},
  {id:'p-h-01',difficulty:'hard',category:'جغرافيا',text:'اذكر دولًا لا تطل على أي بحر أو محيط',target:7,seconds:20},
  {id:'p-h-02',difficulty:'hard',category:'علوم',text:'اذكر عناصر كيميائية رموزها مكوّنة من حرفين',target:8,seconds:20},
  {id:'p-h-03',difficulty:'hard',category:'تاريخ',text:'اذكر عواصم تاريخية لدول أو إمبراطوريات إسلامية',target:6,seconds:20},
  {id:'p-h-04',difficulty:'hard',category:'رياضة',text:'اذكر دولًا استضافت كأس العالم لكرة القدم للرجال',target:8,seconds:20},
  {id:'p-h-05',difficulty:'hard',category:'لغة',text:'اذكر كلمات عربية تبدأ بحرف السين وتنتهي بتاء مربوطة',target:6,seconds:20},
  {id:'p-h-06',difficulty:'hard',category:'تقنية',text:'اذكر لغات برمجة أو استعلام مستخدمة على نطاق واسع',target:8,seconds:20},
  {id:'p-h-07',difficulty:'hard',category:'جغرافيا',text:'اذكر أنهارًا عالمية معروفة غير النيل',target:7,seconds:20},
  {id:'p-h-08',difficulty:'hard',category:'ثقافة',text:'اذكر علماء مسلمين أو عربًا اشتهروا في العلوم الطبيعية أو الرياضيات',target:7,seconds:20},
  {id:'p-e-09',difficulty:'easy',category:'مدرسة',text:'اذكر أدوات تستخدمها عادة في المدرسة أو الجامعة',target:6,seconds:15},
  {id:'p-e-10',difficulty:'easy',category:'مواصلات',text:'اذكر وسائل نقل تستخدم على البر',target:5,seconds:15},
  {id:'p-e-11',difficulty:'easy',category:'فطور',text:'اذكر أطعمة أو مشروبات ممكن تكون على سفرة الفطور',target:6,seconds:15},
  {id:'p-e-12',difficulty:'easy',category:'طقس',text:'اذكر كلمات مرتبطة بحالة الطقس',target:5,seconds:15},
  {id:'p-m-09',difficulty:'medium',category:'الخليج',text:'اذكر دول مجلس التعاون الخليجي',target:6,seconds:18},
  {id:'p-m-10',difficulty:'medium',category:'جغرافيا',text:'اذكر دولًا في قارة أمريكا الجنوبية',target:7,seconds:18},
  {id:'p-m-11',difficulty:'medium',category:'سينما',text:'اذكر أنواعًا معروفة من الأفلام',target:7,seconds:18},
  {id:'p-m-12',difficulty:'medium',category:'علوم',text:'اذكر أعضاء في جسم الإنسان توجد في منطقة البطن أو الصدر',target:6,seconds:18},
  {id:'p-h-09',difficulty:'hard',category:'فيزياء',text:'اذكر وحدات أساسية أو مشتقة مشهورة في النظام الدولي SI',target:7,seconds:20},
  {id:'p-h-10',difficulty:'hard',category:'جغرافيا',text:'اذكر دولًا يمر بها خط الاستواء',target:6,seconds:20},
  {id:'p-h-11',difficulty:'hard',category:'تقنية',text:'اذكر أنظمة إدارة قواعد بيانات معروفة',target:7,seconds:20},
  {id:'p-h-12',difficulty:'hard',category:'تاريخ',text:'اذكر مدنًا كانت عواصم لدول أو إمبراطوريات تاريخية كبرى',target:6,seconds:20},
];

const INTRUDER_ROUNDS: IntruderRound[] = [
  {id:'i-e-01',difficulty:'easy',category:'حيوانات',items:['أسد','نمر','فهد','دلفين'],answer:3,explanation:'الدلفين حيوان بحري، والبقية قطط كبيرة برية.'},
  {id:'i-e-02',difficulty:'easy',category:'تقنية',items:['ويندوز','أندرويد','لينكس','كروم'],answer:3,explanation:'كروم متصفح، والبقية أنظمة تشغيل.'},
  {id:'i-e-03',difficulty:'easy',category:'رياضة',items:['كرة القدم','كرة السلة','كرة الطائرة','السباحة'],answer:3,explanation:'السباحة لا تعتمد على كرة.'},
  {id:'i-e-04',difficulty:'easy',category:'طعام',items:['تفاح','موز','برتقال','بطاطس'],answer:3,explanation:'البطاطس ليست فاكهة.'},
  {id:'i-e-05',difficulty:'easy',category:'جغرافيا',items:['الرياض','جدة','الدمام','دبي'],answer:3,explanation:'دبي ليست مدينة سعودية.'},
  {id:'i-e-06',difficulty:'easy',category:'فضاء',items:['الأرض','المريخ','المشتري','القمر'],answer:3,explanation:'القمر تابع طبيعي وليس كوكبًا.'},
  {id:'i-e-07',difficulty:'easy',category:'لغة',items:['كتاب','قلم','دفتر','سيارة'],answer:3,explanation:'السيارة ليست من أدوات الدراسة المعتادة.'},
  {id:'i-e-08',difficulty:'easy',category:'مهن',items:['طبيب','مهندس','معلم','مطار'],answer:3,explanation:'المطار مكان وليس مهنة.'},
  {id:'i-m-01',difficulty:'medium',category:'جغرافيا',items:['النيل','الأمازون','الدانوب','إيفرست'],answer:3,explanation:'إيفرست جبل، والبقية أنهار.'},
  {id:'i-m-02',difficulty:'medium',category:'علوم',items:['الهيدروجين','الأكسجين','النيتروجين','الماء'],answer:3,explanation:'الماء مركّب، والبقية عناصر.'},
  {id:'i-m-03',difficulty:'medium',category:'أدب',items:['نجيب محفوظ','طه حسين','المتنبي','أحمد زويل'],answer:3,explanation:'أحمد زويل عالم كيمياء، والبقية أسماء أدبية.'},
  {id:'i-m-04',difficulty:'medium',category:'تاريخ',items:['الأموية','العباسية','العثمانية','الأنديز'],answer:3,explanation:'الأنديز سلسلة جبال، والبقية دول أو خلافات تاريخية.'},
  {id:'i-m-05',difficulty:'medium',category:'سيارات',items:['تويوتا','هوندا','نيسان','إيرباص'],answer:3,explanation:'إيرباص شركة طائرات وليست سيارات.'},
  {id:'i-m-06',difficulty:'medium',category:'تقنية',items:['HTML','CSS','JavaScript','Photoshop'],answer:3,explanation:'Photoshop برنامج تصميم، والبقية تقنيات ويب.'},
  {id:'i-m-07',difficulty:'medium',category:'رياضة',items:['ويمبلدون','رولان غاروس','أستراليا المفتوحة','مونزا'],answer:3,explanation:'مونزا حلبة سباق، والبقية بطولات تنس كبرى.'},
  {id:'i-m-08',difficulty:'medium',category:'مدن',items:['القاهرة','الرباط','تونس','إسطنبول'],answer:3,explanation:'إسطنبول ليست عاصمة دولتها حاليًا، بينما البقية عواصم.'},
  {id:'i-h-01',difficulty:'hard',category:'فيزياء',items:['نيوتن','جول','واط','مول'],answer:3,explanation:'المول وحدة كمية المادة، والبقية وحدات مرتبطة بميكانيكا أو طاقة أو قدرة.'},
  {id:'i-h-02',difficulty:'hard',category:'جغرافيا',items:['ليسوتو','بوتسوانا','زامبيا','مدغشقر'],answer:3,explanation:'مدغشقر جزيرة، والبقية دول داخل القارة الأفريقية الرئيسة.'},
  {id:'i-h-03',difficulty:'hard',category:'تاريخ العلوم',items:['الخوارزمي','ابن الهيثم','البيروني','ابن بطوطة'],answer:3,explanation:'ابن بطوطة اشتهر بالرحلات، والبقية اشتهروا أساسًا بالعلوم.'},
  {id:'i-h-04',difficulty:'hard',category:'أدب عالمي',items:['دوستويفسكي','تولستوي','تشيخوف','غابرييل غارسيا ماركيز'],answer:3,explanation:'ماركيز كولومبي، والبقية روس.'},
  {id:'i-h-05',difficulty:'hard',category:'كواكب',items:['عطارد','الزهرة','الأرض','نبتون'],answer:3,explanation:'نبتون كوكب عملاق خارجي، والبقية كواكب صخرية داخلية.'},
  {id:'i-h-06',difficulty:'hard',category:'رياضة',items:['موناكو','سيلفرستون','مونزا','ويمبلي'],answer:3,explanation:'ويمبلي ملعب كرة قدم، والبقية حلبات فورمولا 1.'},
  {id:'i-h-07',difficulty:'hard',category:'لغات',items:['الإسبانية','الفرنسية','الإيطالية','الألمانية'],answer:3,explanation:'الألمانية لغة جرمانية، والبقية لغات رومانسية.'},
  {id:'i-h-08',difficulty:'hard',category:'حاسوب',items:['TCP','UDP','HTTP','JPEG'],answer:3,explanation:'JPEG تنسيق صور، والبقية بروتوكولات شبكات.'},
  {id:'i-e-09',difficulty:'easy',category:'مواصلات',items:['سيارة','حافلة','قطار','ثلاجة'],answer:3,explanation:'الثلاجة جهاز منزلي، والبقية وسائل نقل.'},
  {id:'i-e-10',difficulty:'easy',category:'مدرسة',items:['قلم','مسطرة','ممحاة','وسادة'],answer:3,explanation:'الوسادة ليست من أدوات الدراسة المعتادة.'},
  {id:'i-e-11',difficulty:'easy',category:'مواد',items:['ذهب','فضة','نحاس','خشب'],answer:3,explanation:'الخشب ليس معدنًا، والبقية معادن.'},
  {id:'i-e-12',difficulty:'easy',category:'زمن',items:['صباح','ظهر','مساء','الاثنين'],answer:3,explanation:'الاثنين يوم من أيام الأسبوع، والبقية أوقات من اليوم.'},
  {id:'i-m-09',difficulty:'medium',category:'عواصم',items:['باريس','مدريد','روما','برشلونة'],answer:3,explanation:'برشلونة ليست عاصمة دولة، بينما البقية عواصم دول.'},
  {id:'i-m-10',difficulty:'medium',category:'حاسوب',items:['CPU','RAM','SSD','HDMI'],answer:3,explanation:'HDMI واجهة اتصال للصوت والصورة، والبقية مكونات تخزين أو معالجة وذاكرة داخل الحاسوب.'},
  {id:'i-m-11',difficulty:'medium',category:'فن',items:['بيكاسو','مونيه','فان غوخ','موزارت'],answer:3,explanation:'موزارت موسيقي وملحن، والبقية رسامون.'},
  {id:'i-m-12',difficulty:'medium',category:'فضاء',items:['عطارد','الزهرة','المريخ','بلوتو'],answer:3,explanation:'بلوتو مصنف كوكبًا قزمًا، والبقية كواكب.'},
  {id:'i-h-09',difficulty:'hard',category:'وحدات',items:['كلفن','أمبير','مول','جول'],answer:3,explanation:'الجول وحدة مشتقة للطاقة، والبقية وحدات أساسية في النظام الدولي.'},
  {id:'i-h-10',difficulty:'hard',category:'تقنية',items:['Python','Ruby','JavaScript','PostgreSQL'],answer:3,explanation:'PostgreSQL نظام إدارة قواعد بيانات، والبقية لغات برمجة.'},
  {id:'i-h-11',difficulty:'hard',category:'أدب وفن',items:['شكسبير','ديكنز','جين أوستن','بيتهوفن'],answer:3,explanation:'بيتهوفن ملحن، والبقية كتّاب.'},
  {id:'i-h-12',difficulty:'hard',category:'جغرافيا',items:['الهيمالايا','الألب','الأنديز','الأمازون'],answer:3,explanation:'الأمازون نهر، والبقية سلاسل جبلية.'},
];

const ONLINE_PARAMS = new URLSearchParams(window.location.search);
const ONLINE_EMBED = ONLINE_PARAMS.get('onlineEmbed') === '1';
const ONLINE_TEAM_NAMES: [string, string] = [
  ONLINE_PARAMS.get('onlineTeam0')?.trim() || 'الفريق الأول',
  ONLINE_PARAMS.get('onlineTeam1')?.trim() || 'الفريق الثاني',
];
const ONLINE_DIFFICULTY = (ONLINE_PARAMS.get('onlineDifficulty') || 'medium') as Difficulty;
const PREMIUM_SESSION_TTL = 12 * 60 * 60 * 1000;
const PRESSURE_SESSION_KEY = 'qaddha.pressure.session.v1';
const INTRUDER_SESSION_KEY = 'qaddha.intruder.session.v1';

function readGameSession<T>(key: string): T | null {
  try {
    if (ONLINE_EMBED || !readQaddhaPreferences().rememberProgress) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; data?: T };
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > PREMIUM_SESSION_TTL || !parsed.data) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeGameSession<T>(key: string, data: T) {
  try {
    if (ONLINE_EMBED || !readQaddhaPreferences().rememberProgress) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {/* optional */}
}

function shuffle<T>(input: T[]) {
  const copy = [...input];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickPool<T extends { difficulty: Exclude<Difficulty, 'mixed'> }>(items: T[], difficulty: Difficulty) {
  return shuffle(difficulty === 'mixed' ? items : items.filter(item => item.difficulty === difficulty));
}

function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (value: Difficulty) => void }) {
  const options: { id: Difficulty; label: string }[] = [
    {id:'easy',label:'سهل'},{id:'medium',label:'متوسط'},{id:'hard',label:'صعب'},{id:'mixed',label:'عشوائي'},
  ];
  return <div className="premium-difficulty" role="group" aria-label="مستوى اللعب">{options.map(option=><button key={option.id} aria-pressed={value===option.id} onClick={()=>onChange(option.id)}>{option.label}</button>)}</div>;
}

function TeamStrip({ teams, turn }: { teams: Team[]; turn: number }) {
  return <div className="premium-team-strip">{teams.map((team,index)=><div key={index} className={turn===index?'active':''}><span>{team.name}</span><strong>{team.score}</strong></div>)}</div>;
}

export function PressureGame({ onHome }: { onHome: () => void }) {
  const restoredPressure = useMemo(() => readGameSession<{
    difficulty: Difficulty; teams: Team[]; phase: 'setup'|'playing'|'result'; rounds: number;
    deck: PressurePrompt[]; round: number; timeLeft: number; turn: number;
  }>(PRESSURE_SESSION_KEY), []);
  const [difficulty,setDifficulty]=useState<Difficulty>(ONLINE_EMBED ? ONLINE_DIFFICULTY : restoredPressure?.difficulty || 'mixed');
  const [teams,setTeams]=useState<Team[]>(ONLINE_EMBED ? [{name:ONLINE_TEAM_NAMES[0],score:0},{name:ONLINE_TEAM_NAMES[1],score:0}] : restoredPressure?.teams || [{name:'الفريق الأول',score:0},{name:'الفريق الثاني',score:0}]);
  const [phase,setPhase]=useState<'setup'|'playing'|'result'>(restoredPressure?.phase || 'setup');
  const [rounds,setRounds]=useState(restoredPressure?.rounds || 8);
  const [deck,setDeck]=useState<PressurePrompt[]>(restoredPressure?.deck || []);
  const [round,setRound]=useState(restoredPressure?.round || 0);
  const [started,setStarted]=useState(false);
  const [timeLeft,setTimeLeft]=useState(restoredPressure?.timeLeft || 0);
  const [turn,setTurn]=useState(restoredPressure?.turn || 0);
  const current=deck[round];
  useEffect(()=>{ if(phase==='playing'&&!current){ setPhase('setup'); setRound(0); setTimeLeft(0); } },[phase,current]);
  useEffect(()=>{
    writeGameSession(PRESSURE_SESSION_KEY,{difficulty,teams,phase,rounds,deck,round,timeLeft,turn});
  },[difficulty,teams,phase,rounds,deck,round,timeLeft,turn]);
  const validTeams=teams.every(team=>team.name.trim().length>=2)&&teams[0].name.trim().localeCompare(teams[1].name.trim(),'ar',{sensitivity:'base'})!==0;

  useEffect(()=>{ if(ONLINE_EMBED && phase==='setup' && validTeams) startGame(); },[phase,validTeams]);

  const startGame=()=>{
    if(!validTeams)return;
    const pool=pickPool(PRESSURE_PROMPTS,difficulty);
    const next=pool.slice(0,Math.min(rounds,pool.length));
    if(!next.length)return;
    setDeck(next);setRound(0);setTurn(0);setStarted(false);setTimeLeft(next[0].seconds);setTeams(value=>value.map(team=>({...team,name:team.name.trim(),score:0})));setPhase('playing');
  };

  const beginTimer=()=>{
    if(!current||started)return;
    setStarted(true);setTimeLeft(current.seconds);
    let value=current.seconds;
    const timer=window.setInterval(()=>{
      value-=1;setTimeLeft(Math.max(0,value));
      if(value<=0){window.clearInterval(timer);setStarted(false);}
    },1000);
  };

  const judge=(success:boolean)=>{
    if(!current)return;
    if(success)setTeams(value=>value.map((team,index)=>index===turn?{...team,score:team.score+(current.difficulty==='hard'?300:current.difficulty==='medium'?200:100)}:team));
    if(round+1>=deck.length){setPhase('result');return;}
    const nextRound=round+1;setRound(nextRound);setTurn(value=>(value+1)%2);setStarted(false);setTimeLeft(deck[nextRound].seconds);
  };

  const winner=teams[0].score===teams[1].score?null:teams[0].score>teams[1].score?0:1;

  return <section className="arena premium-game pressure-game" aria-label="لعبة تحت الضغط">
    <div className="arena-heading"><div><span className="eyebrow"><Flame/> تحت الضغط</span><h1>{phase==='setup'?'كم جواب تقدرون تطلعون قبل الصافرة؟':phase==='result'?'انتهى الضغط… وظهر الفائز!':`الجولة ${round+1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft/></button></div>
    {phase==='setup'?<div className="premium-setup-card"><div className="premium-setup-intro"><div className="premium-game-mark"><Flame/></div><div><span>سرعة + معرفة + أعصاب</span><h2>سمّوا العدد المطلوب قبل انتهاء الوقت</h2><p>كل فريق يأخذ دوره. المقدم يقرأ التحدي ويحسب الإجابات الصحيحة ثم يحكم بنجاح الجولة أو فشلها.</p></div></div><div className="premium-team-editors">{teams.map((team,index)=><label key={index}>اسم الفريق {index+1}<input value={team.name} maxLength={20} onChange={event=>setTeams(value=>value.map((item,i)=>i===index?{...item,name:event.target.value}:item))}/></label>)}</div><div className="premium-config"><div><span>المستوى</span><DifficultyPicker value={difficulty} onChange={setDifficulty}/></div><label>عدد الجولات<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={6}>6 جولات</option><option value={8}>8 جولات</option><option value={10}>10 جولات</option></select></label></div><button className="primary premium-start" disabled={!validTeams} onClick={startGame}>ابدأ التحدي <ChevronLeft/></button></div>:null}
    {phase==='playing'&&current?<><TeamStrip teams={teams} turn={turn}/><div className="pressure-stage"><div className="pressure-category"><Sparkles/><span>{current.category}</span><b>{current.difficulty==='easy'?'سهل':current.difficulty==='medium'?'متوسط':'صعب'}</b></div><div className="pressure-target"><small>المطلوب من {teams[turn].name}</small><strong>{current.target}</strong><span>إجابات صحيحة</span></div><h2>{current.text}</h2><div className={`pressure-clock ${timeLeft<=5?'danger':''}`}><Clock3/><strong>{timeLeft}</strong><span>ثانية</span></div>{!started?<button className="primary pressure-go" onClick={beginTimer}><Zap/> ابدأ الوقت</button>:<div className="pressure-live"><span/> الوقت شغال…</div>}<div className="pressure-judge"><button onClick={()=>judge(false)}><X/> ما كملوا</button><button className="success" onClick={()=>judge(true)}><Check/> قدّها!</button></div></div></>:null}
    {phase==='result'?<div className="premium-result"><Trophy/><span>النتيجة النهائية</span><h2>{winner===null?'تعادل قوي!':`${teams[winner].name} أخذها!`}</h2><div className="premium-result-scores">{teams.map((team,index)=><div key={index}><span>{team.name}</span><strong>{team.score}</strong></div>)}</div><div><button className="primary" onClick={startGame}><RotateCcw/> إعادة اللعب</button><button className="quiet" onClick={onHome}>اختيار لعبة ثانية</button></div></div>:null}
  </section>;
}

export function IntruderGame({ onHome }: { onHome: () => void }) {
  const restoredIntruder = useMemo(() => readGameSession<{
    difficulty: Difficulty; teams: Team[]; phase: 'setup'|'playing'|'result'; rounds: number;
    deck: IntruderRound[]; round: number; turn: number; picked: number|null; revealed: boolean;
  }>(INTRUDER_SESSION_KEY), []);
  const [difficulty,setDifficulty]=useState<Difficulty>(ONLINE_EMBED ? ONLINE_DIFFICULTY : restoredIntruder?.difficulty || 'mixed');
  const [teams,setTeams]=useState<Team[]>(ONLINE_EMBED ? [{name:ONLINE_TEAM_NAMES[0],score:0},{name:ONLINE_TEAM_NAMES[1],score:0}] : restoredIntruder?.teams || [{name:'الفريق الأول',score:0},{name:'الفريق الثاني',score:0}]);
  const [phase,setPhase]=useState<'setup'|'playing'|'result'>(restoredIntruder?.phase || 'setup');
  const [rounds,setRounds]=useState(restoredIntruder?.rounds || 8);
  const [deck,setDeck]=useState<IntruderRound[]>(restoredIntruder?.deck || []);
  const [round,setRound]=useState(restoredIntruder?.round || 0);
  const [turn,setTurn]=useState(restoredIntruder?.turn || 0);
  const [picked,setPicked]=useState<number|null>(restoredIntruder?.picked ?? null);
  const [revealed,setRevealed]=useState(restoredIntruder?.revealed || false);
  const current=deck[round];
  useEffect(()=>{ if(phase==='playing'&&!current){ setPhase('setup'); setRound(0); setPicked(null); setRevealed(false); } },[phase,current]);
  useEffect(()=>{
    writeGameSession(INTRUDER_SESSION_KEY,{difficulty,teams,phase,rounds,deck,round,turn,picked,revealed});
  },[difficulty,teams,phase,rounds,deck,round,turn,picked,revealed]);
  const validTeams=teams.every(team=>team.name.trim().length>=2)&&teams[0].name.trim().localeCompare(teams[1].name.trim(),'ar',{sensitivity:'base'})!==0;
  useEffect(()=>{ if(ONLINE_EMBED && phase==='setup' && validTeams) startGame(); },[phase,validTeams]);
  useEffect(()=>{publishMultiplayerTeamNames([teams[0].name,teams[1].name]);},[teams]);
  useEffect(()=>{
    if(phase==='playing'&&current&&!revealed){
      publishMultiplayerChallenge({
        gameId:'intruder',
        roundKey:current.id,
        answers:[current.items[current.answer]],
        choices:current.items,
        points:current.difficulty==='hard'?300:current.difficulty==='medium'?200:100,
      });
      return()=>clearMultiplayerChallenge('intruder');
    }
    clearMultiplayerChallenge('intruder');
  },[current,phase,revealed]);

  const startGame=()=>{
    if(!validTeams)return;
    const pool=pickPool(INTRUDER_ROUNDS,difficulty);
    const next=pool.slice(0,Math.min(rounds,pool.length));
    if(!next.length)return;
    setDeck(next);setRound(0);setTurn(0);setPicked(null);setRevealed(false);setTeams(value=>value.map(team=>({...team,name:team.name.trim(),score:0})));setPhase('playing');
  };

  useEffect(()=>{const receive=(event:Event)=>{const detail=(event as CustomEvent<{gameId?:string;team?:number;points?:number}>).detail;if(detail?.gameId!=='intruder'||phase!=='playing'||revealed||!current)return;const team=detail.team===1?1:0;const points=typeof detail.points==='number'?detail.points:(current.difficulty==='hard'?300:current.difficulty==='medium'?200:100);setPicked(current.answer);setRevealed(true);setTeams(value=>value.map((item,index)=>index===team?{...item,score:item.score+points}:item));};window.addEventListener('qaddha:multiplayer-team-score',receive);return()=>window.removeEventListener('qaddha:multiplayer-team-score',receive);},[current,phase,revealed]);

  const choose=(index:number)=>{
    if(revealed||!current)return;
    setPicked(index);setRevealed(true);
    if(index===current.answer)setTeams(value=>value.map((team,i)=>i===turn?{...team,score:team.score+(current.difficulty==='hard'?300:current.difficulty==='medium'?200:100)}:team));
  };

  const next=()=>{
    if(round+1>=deck.length){setPhase('result');return;}
    setRound(value=>value+1);setTurn(value=>(value+1)%2);setPicked(null);setRevealed(false);
  };

  const winner=teams[0].score===teams[1].score?null:teams[0].score>teams[1].score?0:1;
  const shuffledItems=useMemo(()=>current?shuffle(current.items.map((text,index)=>({text,index}))):[],[current]);

  return <section className="arena premium-game intruder-game" aria-label="لعبة الدخيل">
    <div className="arena-heading"><div><span className="eyebrow"><ShieldQuestion/> الدخيل</span><h1>{phase==='setup'?'أربع كلمات… وحدة منها ما تنتمي للباقي.':phase==='result'?'خلصت الجولات. مين عينه أقوى؟':`الجولة ${round+1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft/></button></div>
    {phase==='setup'?<div className="premium-setup-card"><div className="premium-setup-intro"><div className="premium-game-mark"><Brain/></div><div><span>تصنيف + استنتاج</span><h2>اكتشفوا العنصر المختلف وفسّروا السبب</h2><p>كل جولة فيها أربع اختيارات. فريق واحد يختار الدخيل، وبعدها تظهر الإجابة والسبب مباشرة.</p></div></div><div className="premium-team-editors">{teams.map((team,index)=><label key={index}>اسم الفريق {index+1}<input value={team.name} maxLength={20} onChange={event=>setTeams(value=>value.map((item,i)=>i===index?{...item,name:event.target.value}:item))}/></label>)}</div><div className="premium-config"><div><span>المستوى</span><DifficultyPicker value={difficulty} onChange={setDifficulty}/></div><label>عدد الجولات<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={6}>6 جولات</option><option value={8}>8 جولات</option><option value={10}>10 جولات</option></select></label></div><button className="primary premium-start" disabled={!validTeams} onClick={startGame}>ابدأ الدخيل <ChevronLeft/></button></div>:null}
    {phase==='playing'&&current?<><TeamStrip teams={teams} turn={turn}/><div className="intruder-stage"><div className="pressure-category"><Brain/><span>{current.category}</span><b>{current.difficulty==='easy'?'سهل':current.difficulty==='medium'?'متوسط':'صعب'}</b></div><div className="intruder-prompt"><small>دور {teams[turn].name}</small><h2>وش العنصر الدخيل؟</h2><p>اختاروا واحدًا فقط.</p></div><div className="intruder-grid">{shuffledItems.map(({text,index})=>{const correct=revealed&&index===current.answer;const wrong=revealed&&picked===index&&index!==current.answer;return <button key={index} className={`${correct?'correct':''} ${wrong?'wrong':''}`} disabled={revealed} onClick={()=>choose(index)}><span>{String(index+1).padStart(2,'0')}</span><b>{text}</b>{correct?<Check/>:wrong?<X/>:null}</button>})}</div>{revealed?<div className="intruder-reveal"><span>{picked===current.answer?'إجابة صحيحة ✦':'مو هي…'}</span><p>{current.explanation}</p><button className="primary" onClick={next}>{round+1>=deck.length?'عرض النتيجة':'الجولة التالية'} <ChevronLeft/></button></div>:null}</div></>:null}
    {phase==='result'?<div className="premium-result"><Trophy/><span>النتيجة النهائية</span><h2>{winner===null?'تعادل… وتحتاجون جولة فاصلة!':`${teams[winner].name} اكتشف الدخيل!`}</h2><div className="premium-result-scores">{teams.map((team,index)=><div key={index}><span>{team.name}</span><strong>{team.score}</strong></div>)}</div><div><button className="primary" onClick={startGame}><RefreshCw/> جولة جديدة</button><button className="quiet" onClick={onHome}>الألعاب</button></div></div>:null}
  </section>;
}
