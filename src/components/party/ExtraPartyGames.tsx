import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Brain, Check, ChevronDown, ChevronUp, Eye, Gavel, RotateCcw, Sparkles, Trophy, Users, X } from 'lucide-react';
import { drawWithoutRepeats } from '../../utils/newGameRotation';
import { loadSharedTeams } from '../../utils/sharedTeams';
import { clearMultiplayerChallenge, publishMultiplayerChallenge, publishMultiplayerTeamNames } from '../../utils/multiplayerSession';

const auctionRounds = [
  { id:'auction-01', title:'أشياء تلقاها في المطار', answers:['جواز سفر','بوابة','طائرة','حقائب','موظف جوازات','سوق حر','عربة حقائب','شاشة رحلات'], decoys:['مضرب تنس','فرن','خيمة'] },
  { id:'auction-02', title:'أكلات تبدأ بحرف الميم', answers:['مكرونة','ملوخية','مندي','مطبق','مقلوبة','معصوب'], decoys:['كبسة','شوربة','سمبوسة'] },
  { id:'auction-03', title:'أشياء تستخدمها في المدرسة', answers:['قلم','دفتر','مسطرة','سبورة','حقيبة','كتاب','ممحاة'], decoys:['مقلاة','وسادة','مظلة شاطئ'] },
  { id:'auction-04', title:'رياضات فيها كرة', answers:['كرة القدم','كرة السلة','التنس','الطائرة','اليد','الجولف'], decoys:['السباحة','الجري','المصارعة'] },
  { id:'auction-05', title:'مدن سعودية', answers:['الرياض','جدة','مكة','المدينة','أبها','تبوك','الدمام'], decoys:['دبي','الدوحة','مسقط'] },
  { id:'auction-06', title:'أشياء تحتاج كهرباء غالبًا', answers:['ثلاجة','تلفزيون','مكيف','حاسوب','مصباح','غسالة','ميكروويف'], decoys:['مطرقة','كتاب','مفتاح'] },
  { id:'auction-07', title:'دول عربية في آسيا', answers:['السعودية','الإمارات','قطر','الكويت','البحرين','عُمان','الأردن'], decoys:['المغرب','تونس','الجزائر'] },
  { id:'auction-08', title:'أشياء تراها في ملعب كرة القدم', answers:['مرمى','مدرج','حكم','شبكة','خط تماس','لوحة نتيجة','كرة'], decoys:['مسبح','مضرب','سلة'] },
  { id:'auction-09', title:'حيوانات يمكن أن تعيش في الصحراء', answers:['جمل','ثعلب صحراوي','عقرب','أفعى','ضب','يربوع'], decoys:['بطريق','دلفين','حوت'] },
  { id:'auction-10', title:'أشياء موجودة في المطبخ', answers:['ثلاجة','فرن','مقلاة','سكين','قدر','ملعقة','لوح تقطيع'], decoys:['وسادة','مقود','حذاء'] },
  { id:'auction-11', title:'أشياء مرتبطة بالسفر', answers:['جواز','حجز','فندق','تذكرة','حقيبة','خريطة','طائرة'], decoys:['سبورة','مسمار','مقلاة'] },
  { id:'auction-12', title:'أجهزة تحملها بيدك', answers:['هاتف','ريموت','آلة حاسبة','كاميرا','جهاز ألعاب محمول','قارئ إلكتروني'], decoys:['ثلاجة','غسالة','مكيف'] },
];

const orderRounds = [
  { id:'order-01', title:'رتّب من الأصغر إلى الأكبر', items:['فأر','قطة','حصان','فيل'] },
  { id:'order-02', title:'رتّب من الأقرب للشمس إلى الأبعد', items:['عطارد','الزهرة','الأرض','المريخ'] },
  { id:'order-03', title:'رتّب زمنيًا خلال اليوم', items:['الفجر','الظهر','العصر','المغرب'] },
  { id:'order-04', title:'رتّب من الأقل إلى الأعلى', items:['10','25','50','100'] },
  { id:'order-05', title:'رتّب حسب عدد الحروف من الأقل للأكثر', items:['يد','قمر','سيارة','مدرسة'] },
  { id:'order-06', title:'رتّب هذه الكواكب حسب بعدها عن الشمس', items:['المشتري','زحل','أورانوس','نبتون'] },
  { id:'order-07', title:'رتّب من الأخف إلى الأثقل تقريبًا', items:['ريشة','تفاحة','كرسي','سيارة'] },
  { id:'order-08', title:'رتّب مراحل التعليم المعتادة', items:['ابتدائي','متوسط','ثانوي','جامعة'] },
  { id:'order-09', title:'رتّب من الأسرع إلى الأبطأ تقريبًا', items:['ضوء','صوت','قطار سريع','إنسان يمشي'] },
  { id:'order-10', title:'رتّب وحدات الزمن من الأقصر للأطول', items:['ثانية','دقيقة','ساعة','يوم'] },
  { id:'order-11', title:'رتّب من الأصغر إلى الأكبر جغرافيًا', items:['حي','مدينة','منطقة','دولة'] },
  { id:'order-12', title:'رتّب أعدادًا تصاعديًا', items:['0.5','2','12','120'] },
];

const memoryRounds = [
  { id:'memory-01', items:['قمر','نخلة','كتاب','مفتاح'] },
  { id:'memory-02', items:['بحر','ساعة','كرة','قلم','باب'] },
  { id:'memory-03', items:['نجمة','تفاحة','سيارة','جبل','كوب'] },
  { id:'memory-04', items:['وردة','كرسي','طائرة','شمس','حقيبة','سمكة'] },
  { id:'memory-05', items:['مطر','جسر','قهوة','كاميرا','شجرة'] },
  { id:'memory-06', items:['حصان','سحابة','مفتاح','موز','هاتف','قمر'] },
  { id:'memory-07', items:['نافذة','كتاب','نظارة','بحر','مصباح'] },
  { id:'memory-08', items:['سيارة','ساعة','باب','وردة','جبل','قلم'] },
  { id:'memory-09', items:['تفاحة','طائرة','قهوة','كرسي','نخلة'] },
  { id:'memory-10', items:['كرة','شمس','حقيبة','سمكة','مفتاح','جسر'] },
  { id:'memory-11', items:['كاميرا','مطر','قمر','كتاب','حصان'] },
  { id:'memory-12', items:['هاتف','بحر','وردة','مصباح','سيارة','نظارة'] },
];

const missingRounds = [
  { id:'missing-01', items:['🍎','🚗','⚽','🌙','🔑'], missing:'⚽', choices:['⚽','📚','🎧','🍕'] },
  { id:'missing-02', items:['كتاب','قلم','دفتر','مسطرة','ممحاة'], missing:'دفتر', choices:['دفتر','حقيبة','سبورة','كرسي'] },
  { id:'missing-03', items:['🐪','🐎','🐑','🐓','🐟'], missing:'🐑', choices:['🐑','🐘','🐇','🦒'] },
  { id:'missing-04', items:['الرياض','جدة','أبها','تبوك','حائل'], missing:'أبها', choices:['أبها','الخبر','جازان','ينبع'] },
  { id:'missing-05', items:['شمس','قمر','نجمة','سحابة','مطر'], missing:'سحابة', choices:['سحابة','ريح','ثلج','ضباب'] },
  { id:'missing-06', items:['هاتف','حاسوب','لوحة مفاتيح','فأرة','شاشة'], missing:'فأرة', choices:['فأرة','طابعة','سماعة','كاميرا'] },
  { id:'missing-07', items:['مكة','المدينة','الرياض','جدة','الدمام'], missing:'المدينة', choices:['المدينة','أبها','حائل','تبوك'] },
  { id:'missing-08', items:['☕','📷','🎒','⌚','🚲'], missing:'📷', choices:['📷','🎮','🎧','🧭'] },
  { id:'missing-09', items:['أحمر','أزرق','أخضر','أصفر','بنفسجي'], missing:'أخضر', choices:['أخضر','برتقالي','أسود','أبيض'] },
  { id:'missing-10', items:['طائرة','قطار','سيارة','سفينة','دراجة'], missing:'قطار', choices:['قطار','حافلة','شاحنة','قارب'] },
  { id:'missing-11', items:['سبت','أحد','اثنين','ثلاثاء','أربعاء'], missing:'اثنين', choices:['اثنين','خميس','جمعة','الأحد'] },
  { id:'missing-12', items:['مفتاح','قفل','باب','نافذة','جرس'], missing:'قفل', choices:['قفل','مقبض','سياج','مصباح'] },
];

const distractors = ['نظارة','باب','ورقة','قهوة','جسر','مطر','كاميرا','مصباح'];

function shuffle<T>(values:T[]) {
  const result=[...values];
  for(let i=result.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}

function teamNames():[string,string] {
  const shared=loadSharedTeams();
  return shared ? [shared[0].name,shared[1].name] : ['الفريق الأول','الفريق الثاني'];
}

function Finished({ score, total, onRestart }:{score:string;total:number;onRestart:()=>void}) {
  return <article className="extra-card extra-finished"><Trophy className="hero-icon"/><small>انتهت اللعبة · {total} جولات</small><h2>{score}</h2><button className="primary extra-submit" onClick={onRestart}><RotateCcw/> العب من جديد</button></article>;
}

function Shell({ title, subtitle, icon, onHome, children }: { title:string; subtitle:string; icon:React.ReactNode; onHome:()=>void; children:React.ReactNode }) {
  return <section className="extra-game-shell" dir="rtl"><header className="extra-game-head"><button onClick={onHome} className="quiet"><ArrowRight/> الرئيسية</button><div><span>{icon}</span><div><small>تحدّي قدّها</small><h1>{title}</h1><p>{subtitle}</p></div></div></header>{children}</section>;
}

function TeamScore({ names, score, active, round, total }:{names:[string,string];score:[number,number];active:number;round:number;total:number}) {
  return <div className="extra-score"><b className={active===0?'active':''}>{names[0]} <span>{score[0]}</span></b><b>الجولة {round+1} / {total}</b><b className={active===1?'active':''}>{names[1]} <span>{score[1]}</span></b></div>;
}

export function AuctionGame({ onHome }:{onHome:()=>void}) {
  const [names]=useState(teamNames); const [deck,setDeck]=useState(()=>drawWithoutRepeats('auction',auctionRounds,6,x=>x.id));
  const [round,setRound]=useState(0); const [bid,setBid]=useState(3); const [team,setTeam]=useState(0); const [picked,setPicked]=useState<string[]>([]); const [score,setScore]=useState<[number,number]>([0,0]); const [done,setDone]=useState(false); const [finished,setFinished]=useState(false);
  const current=deck[round] ?? auctionRounds[0];
  const options=useMemo(()=>shuffle([...current.answers,...current.decoys]),[current]);
  const toggle=(x:string)=>{if(done)return;setPicked(p=>p.includes(x)?p.filter(v=>v!==x):p.length<bid?[...p,x]:p)};
  const submit=()=>{const correct=picked.filter(x=>current.answers.includes(x)).length;const winner=correct>=bid?team:1-team;setScore(s=>s.map((v,i)=>i===winner?v+1:v) as [number,number]);setDone(true)};
  const next=()=>{if(round+1>=deck.length){setFinished(true);return;}setRound(r=>r+1);setBid(3);setTeam(t=>1-t);setPicked([]);setDone(false)};
  const restart=()=>{setDeck(drawWithoutRepeats('auction',auctionRounds,6,x=>x.id));setRound(0);setBid(3);setTeam(0);setPicked([]);setScore([0,0]);setDone(false);setFinished(false)};
  const result=score[0]===score[1]?`تعادل ${score[0]} - ${score[1]}`:`${score[0]>score[1]?names[0]:names[1]} فاز · ${score[0]} - ${score[1]}`;
  return <Shell title="المزاد" subtitle="زايدوا على عدد الإجابات… واللي يرسو عليه المزاد لازم يثبت كلامه." icon={<Gavel/>} onHome={onHome}>{finished?<Finished score={result} total={deck.length} onRestart={restart}/>:<><TeamScore names={names} score={score} active={team} round={round} total={deck.length}/><article className="extra-card"><small>موضوع الجولة</small><h2>{current.title}</h2><div className="auction-controls"><button disabled={done} onClick={()=>setBid(v=>Math.max(1,v-1))}>−</button><strong>{bid} إجابات</strong><button disabled={done} onClick={()=>setBid(v=>Math.min(current.answers.length,v+1))}>+</button></div><div className="team-toggle"><button disabled={done} className={team===0?'active':''} onClick={()=>setTeam(0)}>{names[0]}</button><button disabled={done} className={team===1?'active':''} onClick={()=>setTeam(1)}>{names[1]}</button></div><div className="answer-grid">{options.map(x=><button key={x} disabled={done} className={picked.includes(x)?'picked':''} onClick={()=>toggle(x)}>{x}</button>)}</div>{!done?<button className="primary extra-submit" disabled={picked.length!==bid} onClick={submit}>ثبت الإجابات</button>:<div className="extra-result"><Trophy/><b>{picked.filter(x=>current.answers.includes(x)).length>=bid?`${names[team]} وفّى بالمزاد!`:`فشل المزاد · النقطة لـ ${names[1-team]}`}</b><p>الصحيح من اختياراتكم: {picked.filter(x=>current.answers.includes(x)).length} من {bid}</p><button className="secondary" onClick={next}>{round+1===deck.length?'عرض النتيجة':'الجولة التالية'}</button></div>}</article></>}</Shell>;
}

export function OrderGame({ onHome }:{onHome:()=>void}) {
  const [names]=useState(teamNames); const [deck,setDeck]=useState(()=>drawWithoutRepeats('order',orderRounds,8,x=>x.id)); const [round,setRound]=useState(0); const [active,setActive]=useState(0); const current=deck[round]??orderRounds[0]; const [items,setItems]=useState(()=>shuffle(current.items)); const [score,setScore]=useState<[number,number]>([0,0]); const [state,setState]=useState<'play'|'right'|'wrong'>('play'); const [finished,setFinished]=useState(false);
  const move=(i:number,d:number)=>{const j=i+d;if(j<0||j>=items.length||state!=='play')return;const n=[...items];[n[i],n[j]]=[n[j],n[i]];setItems(n)};
  const check=()=>{const ok=items.every((x,i)=>x===current.items[i]);setState(ok?'right':'wrong');if(ok)setScore(s=>s.map((v,i)=>i===active?v+1:v) as [number,number])};
  const next=()=>{if(round+1>=deck.length){setFinished(true);return;}const r=round+1;setRound(r);setActive(r%2);setItems(shuffle(deck[r].items));setState('play')};
  const restart=()=>{const d=drawWithoutRepeats('order',orderRounds,8,x=>x.id);setDeck(d);setRound(0);setActive(0);setItems(shuffle((d[0]??orderRounds[0]).items));setScore([0,0]);setState('play');setFinished(false)};
  const result=score[0]===score[1]?`تعادل ${score[0]} - ${score[1]}`:`${score[0]>score[1]?names[0]:names[1]} فاز · ${score[0]} - ${score[1]}`;
  return <Shell title="رتّبها" subtitle="كل جولة لفريق. رتّبوا العناصر صح قبل كشف الحل." icon={<Sparkles/>} onHome={onHome}>{finished?<Finished score={result} total={deck.length} onRestart={restart}/>:<><TeamScore names={names} score={score} active={active} round={round} total={deck.length}/><article className="extra-card"><small><Users/> دور {names[active]}</small><h2>{current.title}</h2><div className="order-list">{items.map((x,i)=><div key={x}><b>{i+1}</b><span>{x}</span><button aria-label="تحريك لأعلى" disabled={state!=='play'} onClick={()=>move(i,-1)}><ChevronUp/></button><button aria-label="تحريك لأسفل" disabled={state!=='play'} onClick={()=>move(i,1)}><ChevronDown/></button></div>)}</div>{state==='play'?<button className="primary extra-submit" onClick={check}>تحقق من الترتيب</button>:<div className={`extra-result ${state}`}>{state==='right'?<Check/>:<X/>}<b>{state==='right'?'ترتيب صحيح · نقطة!':'مو كذا… الترتيب الصحيح:'}</b>{state==='wrong'&&<p>{current.items.join(' ← ')}</p>}<button className="secondary" onClick={next}>{round+1===deck.length?'عرض النتيجة':'الجولة التالية'}</button></div>}</article></>}</Shell>;
}

export function FlashMemoryGame({ onHome }:{onHome:()=>void}) {
  const [names]=useState(teamNames); const [deck,setDeck]=useState(()=>drawWithoutRepeats('memory',memoryRounds,8,x=>x.id)); const [round,setRound]=useState(0); const [active,setActive]=useState(0); const current=deck[round]??memoryRounds[0]; const [phase,setPhase]=useState<'show'|'answer'|'done'>('show'); const [chosen,setChosen]=useState<string[]>([]); const [score,setScore]=useState<[number,number]>([0,0]); const [finished,setFinished]=useState(false);
  const pool=useMemo(()=>shuffle(Array.from(new Set([...current.items,...distractors])).slice(0,current.items.length+4)),[current]);
  const choose=(x:string)=>{if(phase!=='answer'||chosen.includes(x))return;const next=[...chosen,x];setChosen(next);if(next.length===current.items.length){const ok=next.every((v,i)=>v===current.items[i]);if(ok)setScore(s=>s.map((v,i)=>i===active?v+1:v) as [number,number]);setPhase('done')}};
  const next=()=>{if(round+1>=deck.length){setFinished(true);return;}const r=round+1;setRound(r);setActive(r%2);setChosen([]);setPhase('show')};
  const restart=()=>{setDeck(drawWithoutRepeats('memory',memoryRounds,8,x=>x.id));setRound(0);setActive(0);setChosen([]);setScore([0,0]);setPhase('show');setFinished(false)};
  const ok=phase==='done'&&chosen.every((v,i)=>v===current.items[i]); const result=score[0]===score[1]?`تعادل ${score[0]} - ${score[1]}`:`${score[0]>score[1]?names[0]:names[1]} فاز · ${score[0]} - ${score[1]}`;
  return <Shell title="ذاكرة البرق" subtitle="احفظوا التسلسل ثم رجّعوه بنفس الترتيب. كل جولة لفريق." icon={<Brain/>} onHome={onHome}>{finished?<Finished score={result} total={deck.length} onRestart={restart}/>:<><TeamScore names={names} score={score} active={active} round={round} total={deck.length}/><article className="extra-card memory-card">{phase==='show'?<><Eye className="hero-icon"/><small>دور {names[active]}</small><h2>احفظ الترتيب</h2><div className="memory-strip">{current.items.map((x,i)=><span key={`${x}-${i}`}><b>{i+1}</b>{x}</span>)}</div><button className="primary extra-submit" onClick={()=>setPhase('answer')}>جاهز، اخفها</button></>:<><h2>رجّعها بالترتيب</h2><div className="memory-chosen">{Array.from({length:current.items.length}).map((_,i)=><span key={i}>{chosen[i]||'؟'}</span>)}</div>{phase==='answer'&&<div className="answer-grid">{pool.map(x=><button key={x} disabled={chosen.includes(x)} onClick={()=>choose(x)}>{x}</button>)}</div>}{phase==='done'&&<div className={`extra-result ${ok?'right':'wrong'}`}>{ok?<Check/>:<X/>}<b>{ok?'ذاكرة نار · نقطة!':'الترتيب الصحيح:'}</b>{!ok&&<p>{current.items.join(' ← ')}</p>}<button className="secondary" onClick={next}>{round+1===deck.length?'عرض النتيجة':'الجولة التالية'}</button></div>}</>}</article></>}</Shell>;
}

export function MissingGame({ onHome }:{onHome:()=>void}) {
  const [names]=useState(teamNames); const [deck,setDeck]=useState(()=>drawWithoutRepeats('missing',missingRounds,8,x=>x.id)); const [round,setRound]=useState(0); const [active,setActive]=useState(0); const current=deck[round]??missingRounds[0]; const [hidden,setHidden]=useState(false); const [answer,setAnswer]=useState(''); const [score,setScore]=useState<[number,number]>([0,0]); const [finished,setFinished]=useState(false);
  useEffect(()=>{publishMultiplayerTeamNames(names);},[names]);
  useEffect(()=>{if(!finished&&hidden&&!answer){publishMultiplayerChallenge({gameId:'missing',roundKey:current.id,answers:[current.missing],choices:current.choices,points:1});return()=>clearMultiplayerChallenge('missing');}clearMultiplayerChallenge('missing');},[answer,current,finished,hidden]);
  const visible=hidden?current.items.filter((x,index)=>x!==current.missing||current.items.indexOf(x)!==index):current.items;
  const choices=useMemo(()=>shuffle(current.choices),[current]);
  const pick=(x:string)=>{if(answer||!hidden)return;setAnswer(x);if(x===current.missing)setScore(s=>s.map((v,i)=>i===active?v+1:v) as [number,number])};
  const next=()=>{if(round+1>=deck.length){setFinished(true);return;}const r=round+1;setRound(r);setActive(r%2);setHidden(false);setAnswer('')};
  const restart=()=>{setDeck(drawWithoutRepeats('missing',missingRounds,8,x=>x.id));setRound(0);setActive(0);setHidden(false);setAnswer('');setScore([0,0]);setFinished(false)};
  useEffect(()=>{const receive=(event:Event)=>{const detail=(event as CustomEvent<{gameId?:string;team?:number;points?:number}>).detail;if(detail?.gameId!=='missing'||finished||!hidden||answer)return;const team=detail.team===1?1:0;setScore(value=>value.map((item,index)=>index===team?item+1:item) as [number,number]);setAnswer(current.missing);};window.addEventListener('qaddha:multiplayer-team-score',receive);return()=>window.removeEventListener('qaddha:multiplayer-team-score',receive);},[answer,current.missing,finished,hidden]);
  const result=score[0]===score[1]?`تعادل ${score[0]} - ${score[1]}`:`${score[0]>score[1]?names[0]:names[1]} فاز · ${score[0]} - ${score[1]}`;
  return <Shell title="وش الناقص؟" subtitle="ركزوا في العناصر، نخفي واحد… ودور كل فريق يختبر ملاحظته." icon={<Eye/>} onHome={onHome}>{finished?<Finished score={result} total={deck.length} onRestart={restart}/>:<><TeamScore names={names} score={score} active={active} round={round} total={deck.length}/><article className="extra-card"><small>دور {names[active]}</small><h2>{hidden?'وش العنصر اللي اختفى؟':'احفظ العناصر زين'}</h2><div className="memory-strip">{visible.map((x,i)=><span key={`${x}-${i}`}>{x}</span>)}</div>{!hidden?<button className="primary extra-submit" onClick={()=>setHidden(true)}>جاهز · اخفِ عنصر</button>:!answer?<div className="answer-grid">{choices.map(x=><button key={x} onClick={()=>pick(x)}>{x}</button>)}</div>:<div className={`extra-result ${answer===current.missing?'right':'wrong'}`}>{answer===current.missing?<Check/>:<X/>}<b>{answer===current.missing?'صح · نقطة!':`الناقص كان: ${current.missing}`}</b><button className="secondary" onClick={next}>{round+1===deck.length?'عرض النتيجة':'الجولة التالية'}</button></div>}</article></>}</Shell>;
}
