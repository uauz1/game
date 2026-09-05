import { useEffect, useMemo, useState } from 'react';
import { Gamepad2, Trophy, Users, Sparkles, ArrowLeft, RotateCcw, LogOut, UserRound, Zap, Brain, Camera, Puzzle, Music, Globe2, SaudiRiyal, ChevronLeft, Check, X } from 'lucide-react';
import './index.css';

type Screen = 'home' | 'login' | 'teams' | 'categories' | 'game' | 'results';
type Team = { name: string; score: number };
type Question = { id: number; category: string; points: number; q: string; answers: string[]; correct: number };

const games = [
  { id: 'teams', icon: Users, title: 'قدّها فرق', desc: 'فريقين، فئات، أسئلة ونقاط.', badge: 'الأكثر حماسًا' },
  { id: 'who', icon: Brain, title: 'من أنا؟', desc: 'خمن الشخصية من التلميحات.' },
  { id: 'photo', icon: Camera, title: 'تحدي الصورة', desc: 'اعرف المكان أو الشخصية بسرعة.' },
  { id: 'fast', icon: Zap, title: 'مين أسرع؟', desc: 'أسئلة خاطفة تحسم الجولة.' },
  { id: 'words', icon: Sparkles, title: 'بنك الكلمات', desc: 'كلمات وحروف وتحديات سريعة.' },
  { id: 'character', icon: UserRound, title: 'خمن الشخصية', desc: 'تلميحات تدريجية ونقاط أعلى.' },
  { id: 'riddles', icon: Puzzle, title: 'فوازير', desc: 'ألغاز ممتعة بدرجات مختلفة.' },
  { id: 'family', icon: Trophy, title: 'تحدي العائلة', desc: 'إجابات شائعة ومنافسة جماعية.' },
];

const categories = [
  { name: 'السعودية', icon: '🇸🇦' }, { name: 'رياضة', icon: '⚽' }, { name: 'أفلام ومسلسلات', icon: '🎬' },
  { name: 'حول العالم', icon: '🌍' }, { name: 'علوم', icon: '🧪' }, { name: 'موسيقى', icon: '🎵' },
  { name: 'ألعاب', icon: '🎮' }, { name: 'أكل', icon: '🍔' }, { name: 'معلومات عامة', icon: '📚' },
];

const questions: Question[] = [
  {id:1,category:'السعودية',points:100,q:'ما عاصمة المملكة العربية السعودية؟',answers:['جدة','الرياض','الدمام','أبها'],correct:1},
  {id:2,category:'السعودية',points:200,q:'أي مدينة تُعرف بعروس البحر الأحمر؟',answers:['الرياض','جدة','الطائف','الخبر'],correct:1},
  {id:3,category:'السعودية',points:300,q:'في أي منطقة تقع العلا؟',answers:['المدينة المنورة','القصيم','عسير','نجران'],correct:0},
  {id:4,category:'السعودية',points:400,q:'ما اسم أكبر واحة نخيل شهيرة في شرق المملكة؟',answers:['الأحساء','خيبر','العلا','تيماء'],correct:0},
  {id:5,category:'السعودية',points:500,q:'أي موقع أثري في العلا مُدرج ضمن التراث العالمي؟',answers:['رجال ألمع','مدائن صالح','قصر المصمك','قلعة تاروت'],correct:1},
  {id:6,category:'رياضة',points:100,q:'كم لاعبًا يبدأ به كل فريق مباراة كرة القدم؟',answers:['9','10','11','12'],correct:2},
  {id:7,category:'رياضة',points:200,q:'كم شوطًا في مباراة كرة القدم العادية؟',answers:['1','2','3','4'],correct:1},
  {id:8,category:'رياضة',points:300,q:'في أي رياضة تستخدم الكرة البرتقالية والسلة؟',answers:['الطائرة','السلة','اليد','التنس'],correct:1},
  {id:9,category:'رياضة',points:400,q:'كم حلقة في شعار الألعاب الأولمبية؟',answers:['4','5','6','7'],correct:1},
  {id:10,category:'رياضة',points:500,q:'ما المسافة التقريبية لسباق الماراثون؟',answers:['21 كم','30 كم','42 كم','50 كم'],correct:2},
  {id:11,category:'أفلام ومسلسلات',points:100,q:'ما الجهاز الذي تُعرض عليه الأفلام في السينما؟',answers:['هاتف','شاشة كبيرة','راديو','ساعة'],correct:1},
  {id:12,category:'أفلام ومسلسلات',points:200,q:'من هو الشخص الذي يقود تنفيذ الفيلم فنيًا؟',answers:['المخرج','المحاسب','المصور فقط','الموزع'],correct:0},
  {id:13,category:'أفلام ومسلسلات',points:300,q:'ماذا يسمى النص المكتوب للمشاهد والحوارات؟',answers:['السيناريو','الألبوم','المشهد','الملصق'],correct:0},
  {id:14,category:'أفلام ومسلسلات',points:400,q:'ما الاسم الشائع للحلقة الأولى التجريبية لمسلسل؟',answers:['Pilot','Finale','Trailer','Cut'],correct:0},
  {id:15,category:'أفلام ومسلسلات',points:500,q:'ما المصطلح المستخدم للقطات التي تظهر بعد نهاية بعض الأفلام؟',answers:['Cold open','Post-credit scene','Flashback','Montage'],correct:1},
  {id:16,category:'حول العالم',points:100,q:'ما أكبر قارة مساحة؟',answers:['أفريقيا','آسيا','أوروبا','أستراليا'],correct:1},
  {id:17,category:'حول العالم',points:200,q:'ما عاصمة فرنسا؟',answers:['مدريد','روما','باريس','برلين'],correct:2},
  {id:18,category:'حول العالم',points:300,q:'في أي قارة تقع البرازيل؟',answers:['آسيا','أفريقيا','أمريكا الجنوبية','أوروبا'],correct:2},
  {id:19,category:'حول العالم',points:400,q:'ما المحيط الأكبر على الأرض؟',answers:['الأطلسي','الهندي','الهادئ','المتجمد الشمالي'],correct:2},
  {id:20,category:'حول العالم',points:500,q:'أي دولة تشتهر بمدينة كيوتو؟',answers:['الصين','اليابان','كوريا الجنوبية','تايلاند'],correct:1},
  {id:21,category:'علوم',points:100,q:'ما الكوكب الذي نعيش عليه؟',answers:['المريخ','الأرض','الزهرة','المشتري'],correct:1},
  {id:22,category:'علوم',points:200,q:'ما الغاز الذي يحتاجه الإنسان للتنفس؟',answers:['الهيدروجين','الأكسجين','النيون','الهيليوم'],correct:1},
  {id:23,category:'علوم',points:300,q:'كم عدد كواكب المجموعة الشمسية المعترف بها؟',answers:['7','8','9','10'],correct:1},
  {id:24,category:'علوم',points:400,q:'ما العضو الذي يضخ الدم في جسم الإنسان؟',answers:['الرئة','الكبد','القلب','المعدة'],correct:2},
  {id:25,category:'علوم',points:500,q:'ما الرمز الكيميائي للذهب؟',answers:['Ag','Au','Fe','Gd'],correct:1},
  {id:26,category:'موسيقى',points:100,q:'كم وترًا في الغيتار التقليدي غالبًا؟',answers:['4','5','6','8'],correct:2},
  {id:27,category:'موسيقى',points:200,q:'أي آلة تحتوي على مفاتيح سوداء وبيضاء؟',answers:['البيانو','الكمان','العود','الطبلة'],correct:0},
  {id:28,category:'موسيقى',points:300,q:'ما الشخص الذي يقود الفرقة الموسيقية الكبيرة؟',answers:['المذيع','المايسترو','الكاتب','المنتج'],correct:1},
  {id:29,category:'موسيقى',points:400,q:'ما اسم السرعة الإيقاعية في الموسيقى؟',answers:['Tempo','Canvas','Frame','Tone فقط'],correct:0},
  {id:30,category:'موسيقى',points:500,q:'ما الآلة الوترية العربية ذات الجسم الكمثري؟',answers:['العود','الناي','القانون','الدف'],correct:0},
  {id:31,category:'ألعاب',points:100,q:'ما الجهاز المستخدم غالبًا للتحكم في ألعاب الكونسول؟',answers:['يد تحكم','طابعة','ماسح ضوئي','راوتر'],correct:0},
  {id:32,category:'ألعاب',points:200,q:'ما معنى NPC في الألعاب عادة؟',answers:['شخصية غير لاعب','نقاط إضافية','خادم شبكة','مرحلة سرية'],correct:0},
  {id:33,category:'ألعاب',points:300,q:'ما المصطلح الشائع للمواجهة النهائية مع عدو قوي؟',answers:['Boss fight','Lobby','Patch','Ping'],correct:0},
  {id:34,category:'ألعاب',points:400,q:'ما معنى Co-op؟',answers:['لعب تعاوني','لعب فردي','حفظ تلقائي','تحديث رسومي'],correct:0},
  {id:35,category:'ألعاب',points:500,q:'ما المصطلح الذي يعني تأخر استجابة اللعب عبر الإنترنت؟',answers:['Lag','Skin','Quest','HUD'],correct:0},
  {id:36,category:'أكل',points:100,q:'أي فاكهة تصنع منها الزبيب؟',answers:['العنب','التفاح','البرتقال','الموز'],correct:0},
  {id:37,category:'أكل',points:200,q:'ما المكوّن الأساسي في الحمص الشامي؟',answers:['العدس','الحمص','الأرز','البطاطس'],correct:1},
  {id:38,category:'أكل',points:300,q:'ما التوابل الصفراء المستخدمة كثيرًا في الأرز؟',answers:['الكركم','الفلفل الأسود','الكمون','الملح'],correct:0},
  {id:39,category:'أكل',points:400,q:'أي طبق إيطالي يعتمد على عجينة وصلصة وجبن؟',answers:['سوشي','بيتزا','تاكو','كاري'],correct:1},
  {id:40,category:'أكل',points:500,q:'ما المادة التي تعطي الخبز التقليدي انتفاخه غالبًا؟',answers:['الخميرة','السكر فقط','الملح','الزيت'],correct:0},
  {id:41,category:'معلومات عامة',points:100,q:'كم يومًا في الأسبوع؟',answers:['5','6','7','8'],correct:2},
  {id:42,category:'معلومات عامة',points:200,q:'ما اللون الناتج من مزج الأزرق والأصفر؟',answers:['أخضر','برتقالي','بنفسجي','أحمر'],correct:0},
  {id:43,category:'معلومات عامة',points:300,q:'كم دقيقة في الساعة؟',answers:['50','60','70','100'],correct:1},
  {id:44,category:'معلومات عامة',points:400,q:'أي لغة تُكتب من اليمين إلى اليسار؟',answers:['العربية','الإنجليزية','الفرنسية','الإسبانية'],correct:0},
  {id:45,category:'معلومات عامة',points:500,q:'ما أكبر حيوان معروف على الأرض؟',answers:['الفيل','الحوت الأزرق','الزرافة','القرش الأبيض'],correct:1},
];

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [profile, setProfile] = useState<{name:string;email:string}|null>(() => {
    try { return JSON.parse(localStorage.getItem('qadha-profile') || 'null'); } catch { return null; }
  });
  const [teams, setTeams] = useState<Team[]>([{name:'الصقور',score:0},{name:'الذيبان',score:0}]);
  const [selectedCats, setSelectedCats] = useState<string[]>(categories.slice(0,6).map(c=>c.name));
  const [usedIds, setUsedIds] = useState<number[]>([]);
  const [current, setCurrent] = useState<Question|null>(null);
  const [turn, setTurn] = useState(0);
  const [answered, setAnswered] = useState<number|null>(null);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(12);
  const [activeGame, setActiveGame] = useState('teams');

  useEffect(() => { if (profile) localStorage.setItem('qadha-profile', JSON.stringify(profile)); }, [profile]);

  const availableQuestions = useMemo(() => questions.filter(q => selectedCats.includes(q.category) && !usedIds.includes(q.id)), [selectedCats, usedIds]);

  const nextQuestion = () => {
    const pool = availableQuestions.length ? availableQuestions : questions.filter(q => selectedCats.includes(q.category));
    const q = pool[Math.floor(Math.random()*pool.length)];
    if (!q) return;
    setCurrent(q); setUsedIds(v => [...v, q.id]); setAnswered(null);
  };

  const startGame = () => {
    setTeams(t=>t.map(x=>({...x,score:0}))); setUsedIds([]); setRound(1); setTurn(0); setAnswered(null);
    const pool = questions.filter(q=>selectedCats.includes(q.category));
    const q = pool[Math.floor(Math.random()*pool.length)];
    if(q){ setCurrent(q); setUsedIds([q.id]); }
    setScreen('game');
  };

  const answer = (index:number) => {
    if (!current || answered !== null) return;
    setAnswered(index);
    if(index === current.correct){
      setTeams(ts => ts.map((t,i)=> i===turn ? {...t,score:t.score+current.points} : t));
    }
  };

  const continueGame = () => {
    if(round >= maxRounds){ setScreen('results'); return; }
    setRound(r=>r+1); setTurn(t=>t===0?1:0); nextQuestion();
  };

  const beginFromCard = (id:string) => {
    setActiveGame(id);
    if(!profile){ setScreen('login'); return; }
    setScreen('teams');
  };

  const resetAll = () => { setTeams([{name:'الصقور',score:0},{name:'الذيبان',score:0}]); setUsedIds([]); setRound(1); setScreen('home'); };
  const winner = teams[0].score === teams[1].score ? null : teams[0].score > teams[1].score ? teams[0] : teams[1];

  return <div className="app" dir="rtl">
    <header className="topbar">
      <button className="brand" onClick={()=>setScreen('home')}><span className="brand-mark">ق</span><span>قدّها</span></button>
      <nav><button onClick={()=>setScreen('home')}>الرئيسية</button><button onClick={()=>beginFromCard('teams')}>اللعب</button></nav>
      <div className="profile-pill">{profile ? <><UserRound size={17}/><span>{profile.name}</span><button aria-label="خروج" onClick={()=>{localStorage.removeItem('qadha-profile');setProfile(null);setScreen('home')}}><LogOut size={15}/></button></> : <button onClick={()=>setScreen('login')}>دخول</button>}</div>
    </header>

    <main>
      {screen === 'home' && <>
        <section className="hero">
          <div className="hero-main"><div className="eyebrow"><Sparkles size={16}/> ألعاب جماعية • تحديات • ضحك</div><h1>مين فيكم<br/><span>قدّها؟</span></h1><p>مكان واحد يجمع ألعاب القروب والتحديات السريعة. اختاروا اللعبة، كوّنوا الفرق، وابدأوا المنافسة.</p><div className="hero-actions"><button className="primary" onClick={()=>beginFromCard('teams')}>ابدأ اللعب <ChevronLeft size={18}/></button><a className="secondary" href="#games">استكشف الألعاب</a></div></div>
          <div className="hero-side"><Info value="8+" label="ألعاب متنوعة"/><Info value="45+" label="سؤال كبداية"/><Info value="0" label="تكرار داخل الجولة"/></div>
        </section>
        <section id="games" className="section"><div className="section-head"><div><small>اختاروا جوّكم</small><h2>الألعاب</h2></div><span>كل لعبة مصممة للجلسة</span></div><div className="games-grid">{games.map((g)=>{const Icon=g.icon;return <button className="game-card" key={g.id} onClick={()=>beginFromCard(g.id)}><span className="icon-wrap"><Icon/></span>{g.badge&&<b className="badge">{g.badge}</b>}<h3>{g.title}</h3><p>{g.desc}</p><span className="play-link">ابدأ <ArrowLeft size={16}/></span></button>})}</div></section>
      </>}

      {screen === 'login' && <section className="center-screen"><div className="form-card"><span className="icon-wrap large"><UserRound/></span><h2>دخول سريع</h2><p>نحفظ اسمك ونتائجك على هذا الجهاز فقط.</p><input id="name" placeholder="اسمك" defaultValue={profile?.name||''}/><input id="email" placeholder="البريد الإلكتروني" type="email" defaultValue={profile?.email||''}/><button className="primary full" onClick={()=>{const name=(document.getElementById('name') as HTMLInputElement).value.trim();const email=(document.getElementById('email') as HTMLInputElement).value.trim(); if(name){setProfile({name,email});setScreen('teams')}}}>دخول وابدأ</button><button className="text-btn" onClick={()=>setScreen('home')}>رجوع</button></div></section>}

      {screen === 'teams' && <section className="flow"><Steps current={1}/><div className="flow-head"><div><small>اللعبة: {games.find(g=>g.id===activeGame)?.title}</small><h2>كوّنوا الفرق</h2></div><span>سمّوا كل فريق</span></div><div className="team-grid">{teams.map((t,i)=><div className="team-card" key={i}><span>الفريق {i+1}</span><input value={t.name} onChange={e=>setTeams(ts=>ts.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/><b>{t.score} نقطة</b></div>)}</div><div className="flow-actions"><button className="secondary" onClick={()=>setScreen('home')}>رجوع</button><button className="primary" onClick={()=>setScreen('categories')}>التالي: الفئات <ChevronLeft size={18}/></button></div></section>}

      {screen === 'categories' && <section className="flow"><Steps current={2}/><div className="flow-head"><div><small>اختيار المحتوى</small><h2>اختاروا 6 فئات</h2></div><span>{selectedCats.length} / 6 مختارة</span></div><div className="cat-grid">{categories.map(c=>{const selected=selectedCats.includes(c.name);return <button key={c.name} className={'cat-card '+(selected?'selected':'')} onClick={()=>setSelectedCats(v=>selected?v.filter(x=>x!==c.name):(v.length<6?[...v,c.name]:v))}><span>{c.icon}</span><b>{c.name}</b>{selected&&<Check size={18}/>}</button>})}</div><div className="flow-actions"><button className="secondary" onClick={()=>setScreen('teams')}>رجوع</button><button className="primary" disabled={selectedCats.length<2} onClick={startGame}>ابدأ الجولة <Gamepad2 size={18}/></button></div></section>}

      {screen === 'game' && current && <section className="game-screen"><div className="scorebar"><Score team={teams[0]} active={turn===0}/><div className="round">الجولة <b>{round}</b> / {maxRounds}</div><Score team={teams[1]} active={turn===1}/></div><div className="question-card"><div className="q-meta"><span>{current.category}</span><b>{current.points} نقطة</b></div><small>دور فريق {teams[turn].name}</small><h2>{current.q}</h2><div className="answers">{current.answers.map((a,i)=>{let cls='answer'; if(answered!==null){if(i===current.correct) cls+=' correct'; else if(i===answered) cls+=' wrong';} return <button className={cls} key={i} onClick={()=>answer(i)} disabled={answered!==null}><span>{['أ','ب','ج','د'][i]}</span>{a}{answered!==null&&i===current.correct&&<Check/>}{answered===i&&i!==current.correct&&<X/>}</button>})}</div>{answered!==null&&<button className="primary continue" onClick={continueGame}>{round>=maxRounds?'النتيجة':'السؤال التالي'} <ChevronLeft size={18}/></button>}</div></section>}

      {screen === 'results' && <section className="center-screen"><div className="result-card"><div className="trophy"><Trophy/></div><small>انتهت الجولة</small><h2>{winner ? `${winner.name} قدّها!` : 'تعادل قوي!'}</h2><p>{teams[0].name} <b>{teams[0].score}</b> — <b>{teams[1].score}</b> {teams[1].name}</p><div className="result-actions"><button className="primary" onClick={resetAll}><RotateCcw size={18}/> العبوا من جديد</button><button className="secondary" onClick={()=>setScreen('home')}>الرئيسية</button></div></div></section>}
    </main>
    <footer><span>قدّها</span><p>ألعاب جلسات عربية — نسخة أولية قابلة للتوسع</p></footer>
  </div>;
}

function Info({value,label}:{value:string;label:string}){return <div className="info"><b>{value}</b><span>{label}</span></div>}
function Steps({current}:{current:number}){return <div className="steps"><span className={current>=1?'on':''}>1 الفرق</span><i></i><span className={current>=2?'on':''}>2 الفئات</span><i></i><span className={current>=3?'on':''}>3 اللعب</span></div>}
function Score({team,active}:{team:Team;active:boolean}){return <div className={'score '+(active?'active':'')}><span>{team.name}</span><b>{team.score}</b></div>}

export default App;
