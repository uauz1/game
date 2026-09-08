import { useState } from 'react';
import { ArrowLeft, ChevronLeft, Trophy, Users, Sparkles, Brain, Camera, Zap, UserRound, Puzzle, Gamepad2, Monitor } from 'lucide-react';
import TeamGame from './components/party/TeamGame';
import LettersGame from './components/party/LettersGame';
import WhoAmIGame from './components/party/WhoAmIGame';
import './arena.css';

const games = [
  {id:'teams',title:'قدّها فرق',desc:'اختاروا الفئات. ارفعوا الرهان. وخلّوا المعرفة تحسمها.',icon:Users,tag:'فريقان + مقدم',ready:true},
  {id:'letters',title:'حروف مع عزيز',desc:'حرف واحد، احتمالات كثيرة. مين يجيبها أول؟',icon:Sparkles,tag:'حروف + سرعة بديهة',ready:true},
  {id:'who',title:'من أنا؟',desc:'شخصية غامضة وتلميحات تقرّبكم للحل.',icon:Brain,tag:'تخمين + خطف',ready:true},
  {id:'photo',title:'تحدي الصورة',desc:'التفاصيل الصغيرة تخبّي الإجابة الكبيرة.',icon:Camera,tag:'تحدّي بصري',ready:false},
  {id:'fast',title:'مين أسرع؟',desc:'لحظة واحدة تصنع الفارق.',icon:Zap,tag:'سرعة',ready:false},
  {id:'character',title:'خمن الشخصية',desc:'تلميح وراء تلميح… من تكون؟',icon:UserRound,tag:'شخصيات',ready:false},
  {id:'riddles',title:'فوازير',desc:'فكّروا فيها سوا، الحل أقرب مما تتوقعون.',icon:Puzzle,tag:'ألغاز',ready:false},
  {id:'family',title:'تحدي العائلة',desc:'توقّعوا الإجابات واجمعوا العائلة.',icon:Trophy,tag:'تحدّي جماعي',ready:false},
];

export default function App() {
  const [screen,setScreen]=useState('home');
  const go=(next:string)=>{setScreen(next); window.scrollTo({top:0,behavior:'instant'});};

  return <div className="app party-app" dir="rtl"><header className="topbar"><button className="brand" aria-label="قدّها الرئيسية" onClick={()=>{if(screen==='home')window.scrollTo({top:0,behavior:'smooth'});}} style={{padding:0,background:'transparent',border:0,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'12px',minWidth:'190px'}}>
    <span aria-hidden="true" style={{width:'56px',height:'56px',borderRadius:'17px',display:'grid',placeItems:'center',position:'relative',flex:'0 0 auto',background:'linear-gradient(145deg,#080808,#1a1a1a)',border:'1px solid #d7a93b',boxShadow:'inset 0 0 0 1px #f5d36a22,0 8px 22px #0008,0 0 24px #d7a93b18'}}>
      <Gamepad2 size={34} strokeWidth={1.9} style={{color:'#e7bc4f',filter:'drop-shadow(0 1px 3px #000)'}}/>
      <span style={{position:'absolute',top:'6px',right:'7px',width:'6px',height:'6px',borderRadius:'50%',background:'#f4d36f',boxShadow:'-9px 2px 0 #c99428'}}/>
    </span>
    <span style={{display:'flex',flexDirection:'column',alignItems:'flex-start',lineHeight:1}}>
      <span style={{fontFamily:'Tajawal,Cairo,sans-serif',fontSize:'30px',fontWeight:900,letterSpacing:'-.8px',background:'linear-gradient(180deg,#fff2b0 0%,#e9ba47 45%,#a87519 100%)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',textShadow:'0 2px 12px #d7a93b20'}}>قدّها</span>
      <span style={{fontFamily:'Tajawal,Cairo,sans-serif',fontSize:'9px',fontWeight:700,letterSpacing:'.2px',marginTop:'6px',color:'#b99a55'}}>ألعاب تجمعنا أكثر</span>
    </span>
  </button><span className="topbar-caption">للجمعة اللي تستاهل</span><span className="local-play"><Monitor size={16}/> شاشة واحدة · حماس الجميع</span></header><main>
    {screen==='teams'?<TeamGame onHome={()=>go('home')}/>:screen==='letters'?<LettersGame onHome={()=>go('home')}/>:screen==='who'?<WhoAmIGame onHome={()=>go('home')}/>:<>
      <section className="lobby-hero"><div className="lobby-copy"><span className="eyebrow"><Sparkles size={15}/> افتحها… واجمعهم</span><h1>الجمعة عليكم.<br/><em>والتحدّي علينا.</em></h1><p>حوّلوا جلستكم إلى ساحة منافسة. فريقان، ضحكة، وسؤال يقلب الموازين… مين فيكم قدّها؟</p><div className="hero-actions"><button className="primary" onClick={()=>go('teams')}>ابدأ تحدّي الفرق <ChevronLeft size={19}/></button><a href="#games" className="quiet">شوف الألعاب <ArrowLeft size={17}/></a></div><div className="hero-details"><span>بدون تسجيل</span><i/><span>للجوال والشاشة الكبيرة</span><i/><span>بالعربي، طبعًا</span></div></div><div className="arena-illustration" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="floating-star star-one">✦</span><span className="floating-star star-two">✧</span><div className="illustrated-card card-blue"><Users/><b>الفريق الأول</b><strong>400</strong></div><div className="illustrated-card card-pink"><Users/><b>الفريق الثاني</b><strong>300</strong></div><div className="illustrated-trophy"><Trophy/><span>قدّها</span></div><span className="floating-tile tile-one">ق</span><span className="floating-tile tile-two">؟</span><span className="arena-floor"/></div></section>
      <section id="games" className="lobby-games"><div className="section-head"><div><small>كل جمعة لها جوّها</small><h2>اختاروا التحدّي</h2></div><span>3 ألعاب جاهزة الآن</span></div><div className="lobby-grid">{games.map((g,i)=>{const Icon=g.icon;return <button key={g.id} className={`lobby-game game-${g.id} ${g.ready?'available':'upcoming'}`} disabled={!g.ready} onClick={()=>go(g.id)}><div className="game-art"><span className="game-number">0{i+1}</span>{g.id==='teams'?<div className="mini-board">{[100,200,300,400,500,100].map((n,j)=><span key={j}>{n}</span>)}</div>:g.id==='letters'?<div className="mini-letters">{'ق د ه ا'.split(' ').map((l,j)=><span key={j}>{l}</span>)}</div>:<Icon className="cover-icon"/>}<span className="cover-spark">✦</span><span className="game-status">{g.ready?'العب الآن':'قيد التجهيز'}</span></div><div className="game-copy"><small>{g.tag}</small><h3>{g.title}</h3><p>{g.desc}</p>{g.ready&&<span className="game-arrow"><ArrowLeft size={20}/></span>}</div></button>})}</div></section><section className="lobby-how"><Gamepad2/><div><h2>ثلاث خطوات… وتبدأ السالفة.</h2><p>كوّنوا فريقين، اختاروا تحدّيكم، وخلو واحد يمسك التقديم والتحكيم.</p></div><button className="secondary" onClick={()=>go('teams')}>جاهزين؟</button></section>
    </>}
  </main><footer><span>قدّها <b>✦</b></span><p>جمعتكم أحلى بالتحدّي</p></footer></div>;
}
