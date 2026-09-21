import { useMemo, useState } from 'react';
import { ArrowRight, Brain, Check, ChevronDown, ChevronUp, Eye, Gavel, RotateCcw, Sparkles, Trophy, X } from 'lucide-react';

const auctionRounds = [
  { title: 'أشياء تلقاها في المطار', answers: ['جواز سفر','بوابة','طائرة','حقائب','موظف جوازات','سوق حر','عربة حقائب','شاشة رحلات'], decoys: ['مضرب تنس','فرن','خيمة'] },
  { title: 'أكلات تبدأ بحرف الميم', answers: ['مكرونة','ملوخية','مندي','مطبق','مقلوبة','معصوب'], decoys: ['كبسة','شوربة','سمبوسة'] },
  { title: 'أشياء تستخدمها في المدرسة', answers: ['قلم','دفتر','مسطرة','سبورة','حقيبة','كتاب','ممحاة'], decoys: ['مقلاة','وسادة','مظلة شاطئ'] },
  { title: 'رياضات فيها كرة', answers: ['كرة القدم','كرة السلة','التنس','الطائرة','اليد','الجولف'], decoys: ['السباحة','الجري','المصارعة'] },
  { title: 'مدن سعودية', answers: ['الرياض','جدة','مكة','المدينة','أبها','تبوك','الدمام'], decoys: ['دبي','الدوحة','مسقط'] },
  { title: 'أشياء تلقاها في المطبخ', answers: ['ثلاجة','فرن','قدر','ملعقة','سكين','صحن','كوب'], decoys: ['وسادة','مفتاح سيارة','حذاء'] },
  { title: 'دول عربية', answers: ['السعودية','مصر','المغرب','الأردن','العراق','عُمان','تونس'], decoys: ['إسبانيا','اليابان','البرازيل'] },
  { title: 'أشياء تحتاج كهرباء', answers: ['تلفزيون','مكيف','ثلاجة','حاسوب','غسالة','مصباح','شاحن'], decoys: ['كتاب','قلم','مظلة'] },
  { title: 'حيوانات تعيش في البحر', answers: ['حوت','دلفين','قرش','أخطبوط','سلحفاة','سمكة','سرطان'], decoys: ['أسد','حصان','نسر'] },
  { title: 'أشياء نفعلها في الإجازة', answers: ['سفر','نوم','تسوق','سباحة','زيارة','تصوير','نزهة'], decoys: ['اختبار','دوام','اجتماع'] },
  { title: 'مهن صحية', answers: ['طبيب','ممرض','صيدلي','مسعف','جرّاح','طبيب أسنان'], decoys: ['مهندس','محاسب','نجار'] },
  { title: 'أشياء لونها أخضر غالبًا', answers: ['عشب','نعناع','خيار','شجرة','فلفل','ليمون أخضر'], decoys: ['فحم','ثلج','ذهب'] },
];

const orderRounds = [
  { title: 'رتّب من الأصغر إلى الأكبر', items: ['فأر','قطة','حصان','فيل'] },
  { title: 'رتّب من الأقرب للشمس إلى الأبعد', items: ['عطارد','الزهرة','الأرض','المريخ'] },
  { title: 'رتّب زمنيًا', items: ['الفجر','الظهر','العصر','المغرب'] },
  { title: 'رتّب من الأقل إلى الأعلى', items: ['10','25','50','100'] },
  { title: 'رتّب حسب عدد الحروف', items: ['يد','قمر','سيارة','مدرسة'] },
  { title: 'رتّب فصول السنة', items: ['الربيع','الصيف','الخريف','الشتاء'] },
  { title: 'رتّب مراحل العمر', items: ['طفولة','مراهقة','شباب','شيخوخة'] },
  { title: 'رتّب من الأسرع إلى الأبطأ', items: ['طائرة','سيارة','دراجة','مشي'] },
  { title: 'رتّب من الأصغر إلى الأكبر', items: ['قرية','مدينة','دولة','قارة'] },
  { title: 'رتّب أيام الأسبوع ابتداءً من الأحد', items: ['الأحد','الاثنين','الثلاثاء','الأربعاء'] },
  { title: 'رتّب من الأقل حرارة إلى الأعلى', items: ['ثلج','ماء بارد','ماء دافئ','ماء مغلي'] },
  { title: 'رتّب من الأسفل إلى الأعلى', items: ['قاع البحر','سطح البحر','قمة الجبل','السحاب'] },
];

const memoryRounds = [
  ['قمر','نخلة','كتاب','مفتاح'],
  ['بحر','ساعة','كرة','قلم','باب'],
  ['نجمة','تفاحة','سيارة','جبل','كوب'],
  ['وردة','كرسي','طائرة','شمس','حقيبة','سمكة'],
  ['مطر','نافذة','موز','خاتم'],
  ['جبل','مفتاح','قهوة','ساعة','نخلة'],
  ['كتاب','بحر','هاتف','وردة','قمر'],
  ['سيارة','تفاحة','كرسي','نجمة','باب','قلم'],
  ['طائرة','سمكة','حقيبة','شمس'],
  ['كوب','جسر','كرة','ورقة','نظارة'],
  ['باب','مطر','ساعة','قمر','كتاب'],
  ['نخلة','سيارة','مفتاح','بحر','تفاحة','كرسي'],
];

const missingRounds = [
  { items: ['🍎','🚗','⚽','🌙','🔑'], missing: '⚽', choices: ['⚽','📚','🎧','🍕'] },
  { items: ['كتاب','قلم','دفتر','مسطرة','ممحاة'], missing: 'دفتر', choices: ['دفتر','حقيبة','سبورة','كرسي'] },
  { items: ['🐪','🐎','🐑','🐓','🐟'], missing: '🐑', choices: ['🐑','🐘','🐇','🦒'] },
  { items: ['الرياض','جدة','أبها','تبوك','حائل'], missing: 'أبها', choices: ['أبها','الخبر','جازان','ينبع'] },
  { items: ['شمس','قمر','نجمة','سحاب','مطر'], missing: 'سحاب', choices: ['سحاب','بحر','جبل','رمل'] },
  { items: ['ملعقة','شوكة','سكين','صحن','كوب'], missing: 'سكين', choices: ['سكين','قدر','فرن','ثلاجة'] },
  { items: ['أحمر','أزرق','أخضر','أصفر','بنفسجي'], missing: 'أخضر', choices: ['أخضر','أسود','أبيض','بني'] },
  { items: ['قطار','طائرة','سيارة','سفينة','دراجة'], missing: 'سفينة', choices: ['سفينة','حافلة','شاحنة','قارب'] },
  { items: ['قدم','يد','عين','أذن','أنف'], missing: 'عين', choices: ['عين','رأس','كتف','ركبة'] },
  { items: ['قهوة','شاي','حليب','عصير','ماء'], missing: 'شاي', choices: ['شاي','حساء','زيت','عسل'] },
  { items: ['مكة','المدينة','الرياض','جدة','الدمام'], missing: 'المدينة', choices: ['المدينة','الطائف','تبوك','أبها'] },
  { items: ['⚽','🏀','🎾','🏐','🏓'], missing: '🎾', choices: ['🎾','🏈','🏒','🥊'] },
];

const shuffle = <T,>(values:T[]) => [...values].sort(()=>Math.random()-.5);
function Finished({ score, total, onRestart }:{score:number|string;total:number;onRestart:()=>void}) {
  return <article className="extra-card extra-finished"><Trophy className="hero-icon"/><small>انتهت اللعبة</small><h2>النتيجة {score} / {total}</h2><button className="primary extra-submit" onClick={onRestart}><RotateCcw/> العب من جديد</button></article>;
}

function Shell({ title, subtitle, icon, onHome, children }: { title:string; subtitle:string; icon:React.ReactNode; onHome:()=>void; children:React.ReactNode }) {
  return <section className="extra-game-shell" dir="rtl">
    <header className="extra-game-head"><button onClick={onHome} className="quiet"><ArrowRight/> الرئيسية</button><div><span>{icon}</span><div><small>لعبة جديدة في قدّها</small><h1>{title}</h1><p>{subtitle}</p></div></div></header>
    {children}
  </section>;
}

export function AuctionGame({ onHome }:{onHome:()=>void}) {
  const [round,setRound]=useState(0); const [bid,setBid]=useState(3); const [team,setTeam]=useState(0); const [picked,setPicked]=useState<string[]>([]); const [score,setScore]=useState([0,0]); const [done,setDone]=useState(false); const [finished,setFinished]=useState(false);
  const current=auctionRounds[round%auctionRounds.length];
  const options=useMemo(()=>[...current.answers,...current.decoys].sort((a,b)=>a.localeCompare(b,'ar')),[current]);
  const toggle=(x:string)=>{if(done)return;setPicked(p=>p.includes(x)?p.filter(v=>v!==x):p.length<bid?[...p,x]:p)};
  const submit=()=>{const correct=picked.filter(x=>current.answers.includes(x)).length; const win=correct>=bid; setScore(s=>s.map((v,i)=>i===(win?team:1-team)?v+1:v) as [number,number]); setDone(true)};
  const next=()=>{if(round+1>=auctionRounds.length){setFinished(true);return;}setRound(r=>r+1);setBid(3);setTeam(t=>1-t);setPicked([]);setDone(false)};
  const restart=()=>{setRound(0);setBid(3);setTeam(0);setPicked([]);setScore([0,0]);setDone(false);setFinished(false)};
  return <Shell title="المزاد" subtitle="زايدوا على عدد الإجابات… واللي يرسو عليه المزاد لازم يثبت كلامه." icon={<Gavel/>} onHome={onHome}>
    {finished?<Finished score={`${score[0]} - ${score[1]}`} total={auctionRounds.length} onRestart={restart}/>:<><div className="extra-score"><b>الفريق الأول <span>{score[0]}</span></b><b>الجولة {round+1}</b><b>الفريق الثاني <span>{score[1]}</span></b></div>
    <article className="extra-card"><small>موضوع الجولة</small><h2>{current.title}</h2><div className="auction-controls"><button onClick={()=>setBid(v=>Math.max(1,v-1))}>−</button><strong>{bid} إجابات</strong><button onClick={()=>setBid(v=>Math.min(current.answers.length,v+1))}>+</button></div><div className="team-toggle"><button className={team===0?'active':''} onClick={()=>setTeam(0)}>الفريق الأول</button><button className={team===1?'active':''} onClick={()=>setTeam(1)}>الفريق الثاني</button></div><div className="answer-grid">{options.map(x=><button key={x} className={picked.includes(x)?'picked':''} onClick={()=>toggle(x)}>{x}</button>)}</div>{!done?<button className="primary extra-submit" disabled={picked.length!==bid} onClick={submit}>ثبت الإجابات</button>:<div className="extra-result"><Trophy/><b>{picked.filter(x=>current.answers.includes(x)).length>=bid?'كسب التحدّي!':`المزاد راح للفريق ${team===0?'الثاني':'الأول'}`}</b><button className="secondary" onClick={next}>{round+1===auctionRounds.length?'عرض النتيجة':'الجولة التالية'}</button></div>}</article></>}
  </Shell>
}

export function OrderGame({ onHome }:{onHome:()=>void}) {
  const [round,setRound]=useState(0); const current=orderRounds[round%orderRounds.length]; const [items,setItems]=useState(()=>shuffle(current.items)); const [score,setScore]=useState(0); const [state,setState]=useState<'play'|'right'|'wrong'>('play'); const [finished,setFinished]=useState(false);
  const move=(i:number,d:number)=>{const j=i+d;if(j<0||j>=items.length||state!=='play')return;const n=[...items];[n[i],n[j]]=[n[j],n[i]];setItems(n)};
  const check=()=>{const ok=items.every((x,i)=>x===current.items[i]);setState(ok?'right':'wrong');if(ok)setScore(s=>s+1)};
  const next=()=>{if(round+1>=orderRounds.length){setFinished(true);return;}const r=round+1;setRound(r);setItems(shuffle(orderRounds[r].items));setState('play')};
  const restart=()=>{setRound(0);setItems(shuffle(orderRounds[0].items));setScore(0);setState('play');setFinished(false)};
  return <Shell title="رتّبها" subtitle="حط الأشياء بالترتيب الصحيح قبل ما يضحك عليكم الفريق الثاني." icon={<Sparkles/>} onHome={onHome}>{finished?<Finished score={score} total={orderRounds.length} onRestart={restart}/>:<><div className="extra-score single"><b>النقاط <span>{score}</span></b><b>الجولة {round+1}</b></div><article className="extra-card"><h2>{current.title}</h2><div className="order-list">{items.map((x,i)=><div key={x}><b>{i+1}</b><span>{x}</span><button aria-label="تحريك لأعلى" onClick={()=>move(i,-1)}><ChevronUp/></button><button aria-label="تحريك لأسفل" onClick={()=>move(i,1)}><ChevronDown/></button></div>)}</div>{state==='play'?<button className="primary extra-submit" onClick={check}>تحقق من الترتيب</button>:<div className={`extra-result ${state}`} >{state==='right'?<Check/>:<X/>}<b>{state==='right'?'ترتيب صحيح!':'مو كذا… الترتيب الصحيح:'}</b>{state==='wrong'&&<p>{current.items.join(' ← ')}</p>}<button className="secondary" onClick={next}>{round+1===orderRounds.length?'عرض النتيجة':'الجولة التالية'}</button></div>}</article></>}</Shell>
}

export function FlashMemoryGame({ onHome }:{onHome:()=>void}) {
  const [round,setRound]=useState(0); const current=memoryRounds[round%memoryRounds.length]; const [phase,setPhase]=useState<'show'|'answer'|'done'>('show'); const [chosen,setChosen]=useState<string[]>([]); const [score,setScore]=useState(0); const [finished,setFinished]=useState(false);
  const pool=useMemo(()=>shuffle(Array.from(new Set([...current,'نظارة','باب','ورقة','قهوة','جسر']))),[current]);
  const startAnswer=()=>setPhase('answer'); const choose=(x:string)=>{if(phase!=='answer'||chosen.includes(x))return;const next=[...chosen,x];setChosen(next);if(next.length===current.length){const ok=next.every((v,i)=>v===current[i]);if(ok)setScore(s=>s+1);setPhase('done')}};
  const next=()=>{if(round+1>=memoryRounds.length){setFinished(true);return;}setRound(r=>r+1);setChosen([]);setPhase('show')};
  const restart=()=>{setRound(0);setChosen([]);setScore(0);setPhase('show');setFinished(false)};
  return <Shell title="ذاكرة البرق" subtitle="شوف التسلسل بسرعة، وبعدها رجّعه بنفس الترتيب." icon={<Brain/>} onHome={onHome}>{finished?<Finished score={score} total={memoryRounds.length} onRestart={restart}/>:<><div className="extra-score single"><b>النقاط <span>{score}</span></b><b>الجولة {round+1}</b></div><article className="extra-card memory-card">{phase==='show'?<><Eye className="hero-icon"/><h2>احفظ الترتيب</h2><div className="memory-strip">{current.map((x,i)=><span key={x}><b>{i+1}</b>{x}</span>)}</div><button className="primary extra-submit" onClick={startAnswer}>جاهز، اخفها</button></>:<><h2>رجّعها بالترتيب</h2><div className="memory-chosen">{Array.from({length:current.length}).map((_,i)=><span key={i}>{chosen[i]||'؟'}</span>)}</div>{phase==='answer'&&<div className="answer-grid">{pool.map(x=><button key={x} disabled={chosen.includes(x)} onClick={()=>choose(x)}>{x}</button>)}</div>}{phase==='done'&&<div className={`extra-result ${chosen.every((v,i)=>v===current[i])?'right':'wrong'}`}><b>{chosen.every((v,i)=>v===current[i])?'ذاكرة نار 🔥':'الترتيب الصحيح:'}</b>{!chosen.every((v,i)=>v===current[i])&&<p>{current.join(' ← ')}</p>}<button className="secondary" onClick={next}>{round+1===memoryRounds.length?'عرض النتيجة':'الجولة التالية'}</button></div>}</>}</article></>}</Shell>
}

export function MissingGame({ onHome }:{onHome:()=>void}) {
  const [round,setRound]=useState(0); const current=missingRounds[round%missingRounds.length]; const [hidden,setHidden]=useState(false); const [answer,setAnswer]=useState(''); const [score,setScore]=useState(0); const [finished,setFinished]=useState(false);
  const visible=hidden?current.items.filter(x=>x!==current.missing):current.items;
  const pick=(x:string)=>{if(answer)return;setAnswer(x);if(x===current.missing)setScore(s=>s+1)}; const next=()=>{if(round+1>=missingRounds.length){setFinished(true);return;}setRound(r=>r+1);setHidden(false);setAnswer('')};
  const restart=()=>{setRound(0);setHidden(false);setAnswer('');setScore(0);setFinished(false)};
  return <Shell title="وش الناقص؟" subtitle="ركزوا في العناصر، نخفي واحد… وأسرع واحد يلقطه يكسب." icon={<Eye/>} onHome={onHome}>{finished?<Finished score={score} total={missingRounds.length} onRestart={restart}/>:<><div className="extra-score single"><b>النقاط <span>{score}</span></b><b>الجولة {round+1}</b></div><article className="extra-card"><h2>{hidden?'وش العنصر اللي اختفى؟':'خذوا نظرة كويسة'}</h2><div className="missing-board">{visible.map((x,i)=><span key={`${x}-${i}`}>{x}</span>)}</div>{!hidden?<button className="primary extra-submit" onClick={()=>setHidden(true)}>اخفِ عنصر</button>:!answer?<div className="answer-grid">{current.choices.map(x=><button key={x} onClick={()=>pick(x)}>{x}</button>)}</div>:<div className={`extra-result ${answer===current.missing?'right':'wrong'}`}>{answer===current.missing?<Check/>:<X/>}<b>{answer===current.missing?'صح!':'الإجابة كانت '+current.missing}</b><button className="secondary" onClick={next}><RotateCcw/> {round+1===missingRounds.length?'عرض النتيجة':'الجولة التالية'}</button></div>}</article></>}</Shell>
}
