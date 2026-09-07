import { useReducer, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeft, Check, ChevronLeft, Eye, Grid2X2, Sparkles, Trophy, Users, RotateCcw, Flag } from 'lucide-react';
import { categories, questions, type Question } from '../../data/party';
import Countdown from './Countdown';

type Team = { name: string; color: string; score: number };
type Award = { question: Question; team: number | null };
type State = { stage: 'teams' | 'categories' | 'board' | 'question' | 'results'; teams: Team[]; cats: string[]; limit: number; seconds: number; turn: number; current: Question | null; revealed: boolean; awards: Award[] };
type Action = { type: 'team'; index: number; patch: Partial<Team> } | { type: 'category'; name: string } | { type: 'settings'; limit?: number; seconds?: number } | { type: 'stage'; stage: State['stage'] } | { type: 'start' } | { type: 'pick'; question: Question } | { type: 'reveal' } | { type: 'award'; team: number | null } | { type: 'undo' };
const initial: State = { stage: 'teams', teams: [{name:'الصقور', color:'#45b6ff', score:0}, {name:'الذيبان', color:'#ff70b5', score:0}], cats:categories.slice(0,6).map(c=>c.name), limit:12, seconds:30, turn:0, current:null, revealed:false, awards:[] };
const colors = [{name:'أزرق',value:'#45b6ff'},{name:'وردي',value:'#ff70b5'},{name:'ذهبي',value:'#ffd45a'},{name:'بنفسجي',value:'#b997ff'}];

export function teamReducer(s: State, a: Action): State {
  switch(a.type) {
    case 'team': return {...s, teams:s.teams.map((t,i)=>i===a.index?{...t,...a.patch}:t)};
    case 'category': return {...s,cats:s.cats.includes(a.name)?s.cats.filter(c=>c!==a.name):s.cats.length<6?[...s.cats,a.name]:s.cats};
    case 'settings': return {...s,limit:a.limit??s.limit,seconds:a.seconds??s.seconds};
    case 'stage': return {...s,stage:a.stage};
    case 'start': return {...s,stage:'board',teams:s.teams.map(t=>({...t,name:t.name.trim(),score:0})),turn:0,current:null,revealed:false,awards:[],limit:Math.min(s.limit,s.cats.length*5)};
    case 'pick': return s.stage!=='board'||s.awards.some(r=>r.question.id===a.question.id)?s:{...s,stage:'question',current:a.question,revealed:false};
    case 'reveal': return {...s,revealed:true};
    case 'award': {
      if (s.stage!=='question'||!s.current||!s.revealed) return s;
      const awards=[...s.awards,{question:s.current,team:a.team}];
      return {...s,awards,teams:s.teams.map((t,i)=>i===a.team?{...t,score:t.score+s.current!.points}:t),current:null,revealed:false,turn:1-s.turn,stage:awards.length>=s.limit?'results':'board'};
    }
    case 'undo': {
      const last=s.awards[s.awards.length-1]; if(!last) return s;
      return {...s,stage:'question',current:last.question,revealed:true,turn:1-s.turn,awards:s.awards.slice(0,-1),teams:s.teams.map((t,i)=>i===last.team?{...t,score:t.score-last.question.points}:t)};
    }
  }
}

export default function TeamGame({ onHome }: { onHome: () => void }) {
  const [s, dispatch] = useReducer(teamReducer, initial);
  const [exit, setExit] = useState(false);
  const setup=s.stage==='teams'||s.stage==='categories';
  const winner=s.teams[0].score===s.teams[1].score?null:s.teams[s.teams[0].score>s.teams[1].score?0:1];
  const validNames=s.teams.every(t=>t.name.trim())&&s.teams[0].name.trim()!==s.teams[1].name.trim();
  const tone=(color:string)=>({'--team':color} as CSSProperties);
  return <section className="arena" aria-label="قدّها فرق">
    <div className="arena-heading"><div><span className="eyebrow"><Users size={15}/> قدّها فرق</span><h1>{setup?'جمعتكم… ملعبكم.':s.stage==='results'?'ختامها حماس!':'ساحة التحدّي'}</h1></div><button className="quiet" onClick={()=>setup||s.stage==='results'?onHome():setExit(true)}>الألعاب <ArrowLeft size={17}/></button></div>
    {setup ? <>
      <div className="setup-steps"><span className="on">01 <b>الفرق والإعدادات</b></span><i/><span className={s.stage==='categories'?'on':''}>02 <b>اختيار الفئات</b></span><i/><span>03 <b>ساحة اللعب</b></span></div>
      {s.stage==='teams' ? <>
        <div className="section-heading"><h2>كل فريق له اسم… وله هيبة.</h2><p>فريقان ومقدم، على شاشة واحدة. اختاروا اسمكم ولونكم.</p></div>
        <div className="team-setup">{s.teams.map((team,i)=><div className="team-editor" key={i} style={tone(team.color)}><div className="team-emblem"><Users size={38}/><span>0{i+1}</span></div><label htmlFor={`team-${i}`}>اسم الفريق {i===0?'الأول':'الثاني'}</label><input id={`team-${i}`} maxLength={22} value={team.name} onChange={e=>dispatch({type:'team',index:i,patch:{name:e.target.value}})}/><div className="color-choices" aria-label={`لون الفريق ${i+1}`}>{colors.map(c=><button key={c.value} aria-label={`الفريق ${i+1}: ${c.name}`} aria-pressed={team.color===c.value} disabled={s.teams[1-i].color===c.value} style={{background:c.value}} onClick={()=>dispatch({type:'team',index:i,patch:{color:c.value}})}>{team.color===c.value&&<Check size={18}/>}</button>)}</div><small>لونكم يرافقكم حتى منصة الفوز</small></div>)}</div>
        <div className="match-settings"><div><Sparkles/><b>على مزاج جمعتكم</b></div><label>عدد الأسئلة<select value={s.limit} onChange={e=>dispatch({type:'settings',limit:+e.target.value})}><option value={6}>6 · جولة سريعة</option><option value={12}>12 · التحدي الكامل</option></select></label><label>وقت السؤال<select value={s.seconds} onChange={e=>dispatch({type:'settings',seconds:+e.target.value})}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label></div>
        {!validNames&&<p className="validation" role="status">اكتبوا اسمين مختلفين وغير فارغين للفريقين.</p>}
        <div className="arena-actions"><span>كل سؤال فرصة تقلب النتيجة.</span><button className="primary" disabled={!validNames} onClick={()=>dispatch({type:'stage',stage:'categories'})}>اختاروا الفئات <ChevronLeft size={18}/></button></div>
      </> : <>
        <div className="section-heading"><h2>في إيش أنتم قدّها؟</h2><p>اختاروا من 3 إلى 6 فئات. لكل فئة خمسة أسئلة بقيم من 100 إلى 500 نقطة.</p><span className="selection-count">{s.cats.length} / 6 فئات</span></div>
        <div className="category-picker">{categories.map((cat,i)=><button className={s.cats.includes(cat.name)?'chosen':''} key={cat.name} aria-pressed={s.cats.includes(cat.name)} disabled={s.cats.length===6&&!s.cats.includes(cat.name)} onClick={()=>dispatch({type:'category',name:cat.name})}><span className={`category-art art-${i%4}`}>{cat.icon}</span><b>{cat.name}</b><small>5 أسئلة</small><span className="check-box">{s.cats.includes(cat.name)&&<Check size={15}/>}</span></button>)}</div>
        <div className="arena-actions"><button className="quiet" onClick={()=>dispatch({type:'stage',stage:'teams'})}>تعديل الفرق</button><button className="primary" disabled={s.cats.length<3} onClick={()=>dispatch({type:'start'})}>يلا… قدّها! <Flag size={18}/></button></div>
      </>}
      <div className="host-note"><span>✦</span><p><b>المقدم يدير الحماس.</b> اختاروا فئة وقيمة، جاوبوا بصوت عالٍ، ثم يكشف المقدم الإجابة ويمنح النقاط للفريق المستحق.</p></div>
    </> : <>
      <div className="arena-scores">{s.teams.map((t,i)=><div className={`arena-score ${s.turn===i&&s.stage!=='results'?'is-turn':''}`} key={i} style={tone(t.color)}><div className="score-symbol"><Users/></div><div><span>{t.name}</span><small>{s.stage==='results'?'النتيجة النهائية':s.turn===i?'دوركم تختارون':'جهّزوا الإجابة'}</small></div><strong data-testid={`score-${i}`}>{t.score}<small>نقطة</small></strong></div>)}<div className="match-progress"><span>{s.stage==='results'?'اكتملت المنافسة':'السؤال'}</span><strong>{Math.min(s.awards.length+1,s.limit)} <small>/ {s.limit}</small></strong><div><i style={{width:`${s.awards.length/s.limit*100}%`}}/></div></div></div>
      {s.stage==='board'&&<>
        <div className="board-heading"><div><h2>اختاروا التحدّي</h2><p><span style={{color:s.teams[s.turn].color}}>{s.teams[s.turn].name}</span>، اختاروا الفئة وقيمة السؤال.</p></div><span className="board-label"><Grid2X2 size={16}/> لوحة الأسئلة</span></div>
        <div className="question-board" style={{'--columns':s.cats.length} as CSSProperties}>{s.cats.map(cat=><div className="board-column" key={cat}><div className="board-category"><span>{categories.find(c=>c.name===cat)?.icon}</span><h3>{cat}</h3></div>{questions.filter(q=>q.category===cat).map(q=>{const award=s.awards.find(r=>r.question.id===q.id);return <button className={award?'played':''} key={q.id} disabled={!!award} aria-label={`${cat}، ${q.points} نقطة`} onClick={()=>dispatch({type:'pick',question:q})}><strong>{award?<Check size={24}/>:q.points}</strong><small>{award?(award.team===null?'بلا نقاط':s.teams[award.team].name):'نقطة'}</small></button>})}</div>)}</div>
        <div className="board-footer"><span>القيم الأعلى تمنح نقاطًا أكثر. السؤال المستخدم يُغلق لبقية الجولة.</span><button className="quiet" disabled={!s.awards.length} onClick={()=>dispatch({type:'undo'})}><RotateCcw size={16}/> تصحيح آخر تحكيم</button></div>
      </>}
      {s.stage==='question'&&s.current&&<div className="question-stage"><div className="question-spotlight"><div className="question-top"><span>{s.current.category}</span><b>{s.current.points} <small>نقطة</small></b></div><span className="question-kicker">اسمعوا السؤال… وخذوا وقتكم</span><h2>{s.current.q}</h2>{s.revealed?<div className="revealed-answer" role="status"><span><Check size={18}/> الإجابة الصحيحة</span><strong>{s.current.answers[s.current.correct]}</strong></div>:<div className="hidden-answer"><span>؟</span> الإجابة عند المقدم… جاهزين؟</div>}<div className="spotlight-bottom">قدّها <span>✦</span> التحدّي يجمعنا</div></div><aside className="host-controls"><Countdown key={s.current.id} seconds={s.seconds} stopped={s.revealed}/><div className="judging"><small>أدوات المقدم</small>{!s.revealed?<><h3>سمعتوا الإجابة؟</h3><p>اكشف الحل، ثم حدد الفريق المستحق للنقاط.</p><button className="primary" onClick={()=>dispatch({type:'reveal'})}><Eye size={18}/> كشف الإجابة</button></>:<><h3>مين يستاهل النقاط؟</h3><p>اختيارك يحفظ النتيجة وينقلك للسؤال التالي.</p>{s.teams.map((t,i)=><button className="award-button" style={tone(t.color)} key={i} onClick={()=>dispatch({type:'award',team:i})}><span>{t.name}</span><b>+{s.current!.points}</b></button>)}<button className="quiet no-points" onClick={()=>dispatch({type:'award',team:null})}>لا أحد · بدون نقاط</button></>}</div></aside></div>}
      {s.stage==='results'&&<div className="arena-result"><div className="result-sparks" aria-hidden="true">✦ ✧ ✦</div><div className="winner-cup"><Trophy size={70}/></div><span className="eyebrow">{s.limit} أسئلة… وجمعة ما تنسى</span><h2>{winner?`${winner.name}… قدّها!`:'كلكم قدّها!'}</h2><p>{winner?'المنافسة كانت قوية… والصدارة لكم.':'تعادل! جولة ثانية تحسمها؟'}</p><div className="result-summary"><span>{s.awards.filter(a=>a.team!==null).length}<small>أسئلة حُسمت</small></span><span>{Math.abs(s.teams[0].score-s.teams[1].score)}<small>فارق النقاط</small></span><span>{s.cats.length}<small>فئات لعبتوها</small></span></div><div className="result-actions"><button className="primary" onClick={()=>dispatch({type:'start'})}><RotateCcw size={18}/> جولة جديدة بنفس الفرق</button><button className="secondary" onClick={()=>dispatch({type:'stage',stage:'teams'})}>تغيير الإعدادات</button></div><button className="quiet" onClick={()=>dispatch({type:'undo'})}>تصحيح آخر تحكيم</button><details className="round-history"><summary>سجل الجولة</summary>{s.awards.map((a,i)=><div key={a.question.id}><span>{i+1}. {a.question.category} · {a.question.points}</span><b>{a.team===null?'بلا نقاط':s.teams[a.team].name}</b></div>)}</details></div>}
    </>}
    {exit&&<div className="exit-overlay"><div role="dialog" aria-modal="true" aria-labelledby="exit-title"><h2 id="exit-title">نوقف التحدّي؟</h2><p>العودة للألعاب تنهي الجولة الحالية وتحذف نقاطها.</p><button autoFocus className="primary" onClick={()=>setExit(false)}>نكمل اللعب</button><button className="quiet" onClick={onHome}>إنهاء والعودة للألعاب</button></div></div>}
  </section>;
}
