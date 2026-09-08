import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, Trophy, Users, Sparkles, Brain, Camera, Search, Shuffle, Zap, UserRound, Puzzle, Gamepad2, Heart, Monitor, Settings as SettingsIcon } from 'lucide-react';
import SiteSettings, { useQaddhaPreferences } from './components/party/SiteSettings';
import PlayerPanel, { type PlayerActivity } from './components/party/PlayerPanel';
import { useAuth } from './contexts/AuthContext';
import { usePWA } from './hooks/usePWA';
import './arena.css';
import './newgames.css';

const TeamGame = lazy(() => import('./components/party/TeamGame'));
const LettersGame = lazy(() => import('./components/party/LettersGame'));
const WhoAmIGame = lazy(() => import('./components/party/WhoAmIGame'));
const PhotoChallengeGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.PhotoChallengeGame })));
const WordBankGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.WordBankGame })));
const FastestGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.FastestGame })));
const CharacterGuessGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.CharacterGuessGame })));
const RiddlesGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.RiddlesGame })));
const FamilyFeudGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.FamilyFeudGame })));
const FamilyHostController = lazy(() => import('./components/party/HostRoom').then(module => ({ default: module.FamilyHostController })));
const AuthModal = lazy(() => import('./components/party/AuthModal'));
const HelpCenter = lazy(() => import('./components/party/HelpCenter'));

function GameLoading() {
  return <section className="game-loading" role="status" aria-live="polite"><Gamepad2/><span>نجهّز التحدّي…</span></section>;
}

const games = [
  {id:'teams',title:'قدّها فرق',desc:'اختاروا الفئات. ارفعوا الرهان. وخلّوا المعرفة تحسمها.',icon:Users,tag:'فريقان + مقدم',cover:'/assets/teams-cover.jpg',ready:true},
  {id:'letters',title:'حروف مع عزيز',desc:'حرف واحد، احتمالات كثيرة. مين يجيبها أول؟',icon:Sparkles,tag:'حروف + سرعة بديهة',cover:'/assets/letters-cover.jpg',ready:true},
  {id:'who',title:'من أنا؟',desc:'شخصية غامضة وتلميحات تقرّبكم للحل.',icon:Brain,tag:'تخمين + خطف',cover:'/assets/who-cover.jpg',ready:true},
  {id:'photo',title:'تحدي الصورة',desc:'التفاصيل الصغيرة تخبّي الإجابة الكبيرة.',icon:Camera,tag:'تحدّي بصري',cover:'/assets/photo-cover.jpg',ready:true},
  {id:'words',title:'بنك الكلمات',desc:'اوصف الكلمة من غير ما تقول الكلمات الممنوعة.',icon:BookOpen,tag:'كلمات + وصف',cover:'/assets/word-bank-cover-wide.jpg',ready:true},
  {id:'fast',title:'مين أسرع؟',desc:'لحظة واحدة تصنع الفارق.',icon:Zap,tag:'سرعة + زر',cover:'/assets/fastest-cover.jpg',ready:true},
  {id:'character',title:'خمن الشخصية',desc:'تلميح وراء تلميح… من تكون؟',icon:UserRound,tag:'شخصيات',cover:'/assets/character-cover.jpg',ready:true},
  {id:'riddles',title:'فوازير',desc:'فكّروا فيها سوا، الحل أقرب مما تتوقعون.',icon:Puzzle,tag:'ألغاز',cover:'/assets/riddles-cover.jpg',ready:true},
  {id:'family',title:'تحدي العائلة',desc:'اكشفوا أشهر إجابات الجمهور واجمعوا النقاط.',icon:Trophy,tag:'إجابات جمهور',cover:'/assets/family-cover.jpg',ready:true},
];
const gameGroups: Record<string,string> = {teams:'جماعية',letters:'كلمات',who:'تخمين',photo:'تحديات',words:'كلمات',fast:'سريعة',character:'تخمين',riddles:'تحديات',family:'جماعية'};
const PLAYER_KEY = 'qaddha.player.v1';

function readPlayerData(): { favorites: string[]; recent: PlayerActivity[] } {
  try {
    const stored = JSON.parse(localStorage.getItem(PLAYER_KEY) || '{}');
    return {
      favorites: Array.isArray(stored.favorites) ? stored.favorites.filter((id: unknown): id is string => typeof id === 'string') : [],
      recent: Array.isArray(stored.recent) ? stored.recent.filter((item: PlayerActivity) => typeof item?.gameId === 'string' && typeof item?.playedAt === 'number').slice(0, 8) : [],
    };
  } catch { return { favorites: [], recent: [] }; }
}

export default function App() {
  const [screen,setScreen]=useState('home');
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [playerOpen,setPlayerOpen]=useState(false);
  const [authOpen,setAuthOpen]=useState(false);
  const [helpOpen,setHelpOpen]=useState(false);
  const [homeConfirm,setHomeConfirm]=useState(false);
  const [gameSearch,setGameSearch]=useState('');
  const [gameFilter,setGameFilter]=useState('الكل');
  const [lastGame,setLastGame]=useState(()=>{try{return localStorage.getItem('qaddha.last-game')||''}catch{return ''}});
  const [playerData,setPlayerData]=useState(readPlayerData);
  const auth=useAuth();
  useQaddhaPreferences();
  usePWA();
  const savePlayerData=(next:typeof playerData)=>{setPlayerData(next);try{localStorage.setItem(PLAYER_KEY,JSON.stringify(next))}catch{/* Guest history stays available for this visit. */}};
  const go=(next:string)=>{if(games.some(game=>game.id===next)){setLastGame(next);const recent=[{gameId:next,playedAt:Date.now()},...playerData.recent.filter(item=>item.gameId!==next)].slice(0,8);savePlayerData({...playerData,recent});try{localStorage.setItem('qaddha.last-game',next)}catch{/* Recent game is optional. */}}setHomeConfirm(false);setScreen(next); window.scrollTo({top:0,behavior:'instant'});};
  const toggleFavorite=(gameId:string)=>{const favorites=playerData.favorites.includes(gameId)?playerData.favorites.filter(id=>id!==gameId):[...playerData.favorites,gameId];savePlayerData({...playerData,favorites});};
  const isGame=games.some(game=>game.id===screen);
  useEffect(()=>{
    if(!isGame)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);
    return()=>window.removeEventListener('beforeunload',warn);
  },[isGame]);
  useEffect(()=>{
    if(!homeConfirm)return;
    const previousOverflow=document.body.style.overflow;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setHomeConfirm(false);};
    document.body.style.overflow='hidden';
    window.addEventListener('keydown',close);
    return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',close);};
  },[homeConfirm]);
  const filteredGames=useMemo(()=>{const query=gameSearch.trim();return games.filter(game=>(gameFilter==='الكل'||gameGroups[game.id]===gameFilter)&&(!query||`${game.title} ${game.desc} ${game.tag}`.includes(query)));},[gameFilter,gameSearch]);
  const randomGame=(pool=games)=>{const choices=pool.length?pool:games;go(choices[Math.floor(Math.random()*choices.length)].id);};
  const hostParams=useMemo(()=>new URLSearchParams(window.location.search),[]);

  if(hostParams.get('host')==='family')return <div className="app party-app host-app" dir="rtl"><Suspense fallback={<GameLoading/>}><FamilyHostController roomId={hostParams.get('room')||''} token={hostParams.get('token')||''}/></Suspense></div>;

  return <div className="app party-app" dir="rtl"><header className="topbar"><button className="brand" aria-label="قدّها الرئيسية" onClick={()=>{if(screen==='home')window.scrollTo({top:0,behavior:'smooth'});else if(isGame)setHomeConfirm(true);else go('home');}} style={{padding:0,background:'transparent',border:0,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'12px',minWidth:'190px'}}>
    <span aria-hidden="true" style={{width:'56px',height:'56px',borderRadius:'17px',display:'grid',placeItems:'center',position:'relative',flex:'0 0 auto',background:'linear-gradient(145deg,#080808,#1a1a1a)',border:'1px solid #d7a93b',boxShadow:'inset 0 0 0 1px #f5d36a22,0 8px 22px #0008,0 0 24px #d7a93b18'}}>
      <Gamepad2 size={34} strokeWidth={1.9} style={{color:'#e7bc4f',filter:'drop-shadow(0 1px 3px #000)'}}/>
      <span style={{position:'absolute',top:'6px',right:'7px',width:'6px',height:'6px',borderRadius:'50%',background:'#f4d36f',boxShadow:'-9px 2px 0 #c99428'}}/>
    </span>
    <span style={{display:'flex',flexDirection:'column',alignItems:'flex-start',lineHeight:1}}>
      <span style={{fontFamily:'Tajawal,Cairo,sans-serif',fontSize:'30px',fontWeight:900,letterSpacing:'-.8px',background:'linear-gradient(180deg,#fff2b0 0%,#e9ba47 45%,#a87519 100%)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',textShadow:'0 2px 12px #d7a93b20'}}>قدّها</span>
      <span style={{fontFamily:'Tajawal,Cairo,sans-serif',fontSize:'9px',fontWeight:700,letterSpacing:'.2px',marginTop:'6px',color:'#b99a55'}}>ألعاب تجمعنا أكثر</span>
    </span>
  </button><span className="topbar-caption">للجمعة اللي تستاهل</span><div className="topbar-actions"><span className="local-play"><Monitor size={16}/> شاشة واحدة · حماس الجميع</span><button className="header-profile-button" onClick={()=>setPlayerOpen(true)} aria-label="ملف اللاعب"><UserRound size={18}/><span>{auth.session?.user.user_metadata.display_name || auth.session?.user.email?.split('@')[0] || 'ضيف'}</span></button><button className="header-settings-button" onClick={()=>setSettingsOpen(true)} aria-label="إعدادات قدّها"><SettingsIcon size={18}/><span>الإعدادات</span></button></div></header><main><Suspense fallback={<GameLoading/>}>
    {screen==='teams'?<TeamGame onHome={()=>setHomeConfirm(true)}/>:screen==='letters'?<LettersGame onHome={()=>setHomeConfirm(true)}/>:screen==='who'?<WhoAmIGame onHome={()=>setHomeConfirm(true)}/>:screen==='photo'?<PhotoChallengeGame onHome={()=>setHomeConfirm(true)}/>:screen==='words'?<WordBankGame onHome={()=>setHomeConfirm(true)}/>:screen==='fast'?<FastestGame onHome={()=>setHomeConfirm(true)}/>:screen==='character'?<CharacterGuessGame onHome={()=>setHomeConfirm(true)}/>:screen==='riddles'?<RiddlesGame onHome={()=>setHomeConfirm(true)}/>:screen==='family'?<FamilyFeudGame onHome={()=>setHomeConfirm(true)}/>:<>
      <section className="lobby-hero"><div className="lobby-copy"><span className="eyebrow"><Sparkles size={15}/> افتحها… واجمعهم</span><h1>الجمعة عليكم.<br/><em>والتحدّي علينا.</em></h1><p>حوّلوا جلستكم إلى ساحة منافسة. فريقان، ضحكة، وسؤال يقلب الموازين… مين فيكم قدّها؟</p><div className="hero-actions"><button className="primary" onClick={()=>go('teams')}>ابدأ تحدّي الفرق <ChevronLeft size={19}/></button><button className="quiet" onClick={()=>randomGame()}><Shuffle size={17}/> اختاروا لنا</button><a href="#games" className="quiet">شوف الألعاب <ArrowLeft size={17}/></a>{lastGame&&<button className="quiet recent-game" onClick={()=>go(lastGame)}>كمّل: {games.find(game=>game.id===lastGame)?.title}</button>}</div><div className="hero-details"><span>بدون تسجيل</span><i/><span>للجوال والشاشة الكبيرة</span><i/><span>بالعربي، طبعًا</span></div></div><div className="arena-illustration" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="floating-star star-one">✦</span><span className="floating-star star-two">✧</span><div className="illustrated-card card-blue"><Users/><b>الفريق الأول</b><strong>400</strong></div><div className="illustrated-card card-pink"><Users/><b>الفريق الثاني</b><strong>300</strong></div><div className="illustrated-trophy"><Trophy/><span>قدّها</span></div><span className="floating-tile tile-one">ق</span><span className="floating-tile tile-two">؟</span><span className="arena-floor"/></div></section>
      <section id="games" className="lobby-games"><div className="section-head"><div><small>كل جمعة لها جوّها</small><h2>اختاروا التحدّي</h2></div><span>{filteredGames.length===games.length?`${games.length} ألعاب جاهزة الآن`:`${filteredGames.length} من ${games.length} ألعاب`}</span></div><div className="game-library-tools"><label><Search/><input aria-label="البحث في الألعاب" placeholder="ابحث بالاسم أو نوع التحدّي…" value={gameSearch} onChange={event=>setGameSearch(event.target.value)}/></label><div>{['الكل','جماعية','سريعة','تحديات','كلمات','تخمين'].map(group=><button key={group} aria-pressed={gameFilter===group} className={gameFilter===group?'active':''} onClick={()=>setGameFilter(group)}>{group}</button>)}</div><button className="random-game" disabled={!filteredGames.length} onClick={()=>randomGame(filteredGames)}><Shuffle/> اختيار عشوائي من النتائج</button></div>{filteredGames.length?<div className="lobby-grid">{filteredGames.map((g)=>{const i=games.findIndex(game=>game.id===g.id);const favorite=playerData.favorites.includes(g.id);return <div className="game-card-shell" key={g.id}><button className={`lobby-game game-${g.id} ${g.ready?'available':'upcoming'}`} disabled={!g.ready} onClick={()=>go(g.id)}><div className="game-art"><span className="game-number">{String(i+1).padStart(2,'0')}</span><img className="game-cover-image" src={g.cover} alt="" loading="lazy" decoding="async"/><span className="cover-spark">✦</span><span className="game-status">العب الآن</span></div><div className="game-copy"><small>{g.tag}</small><h3>{g.title}</h3><p>{g.desc}</p><span className="game-arrow"><ArrowLeft size={20}/></span></div></button><button className={`game-favorite ${favorite?'active':''}`} aria-pressed={favorite} aria-label={`${favorite?'إزالة':'إضافة'} ${g.title} ${favorite?'من':'إلى'} المفضلة`} onClick={()=>toggleFavorite(g.id)}><Heart fill={favorite?'currentColor':'none'}/></button></div>})}</div>:<div className="category-empty"><Search/><h3>ما لقينا لعبة بهذا الاسم</h3><p>امسح البحث أو اختر تصنيفًا ثانيًا.</p><button className="quiet" onClick={()=>{setGameSearch('');setGameFilter('الكل');}}>عرض كل الألعاب</button></div>}</section><section className="lobby-how"><Gamepad2/><div><h2>ثلاث خطوات… وتبدأ السالفة.</h2><p>كوّنوا فريقين، اختاروا تحدّيكم، وخلو واحد يمسك التقديم والتحكيم.</p></div><button className="secondary" onClick={()=>go('teams')}>جاهزين؟</button></section>
    </>}
  </Suspense></main><footer><span>قدّها <b>✦</b></span><p>جمعتكم أحلى بالتحدّي</p><button onClick={()=>setHelpOpen(true)}>طريقة اللعب · الخصوصية · المساعدة</button></footer><SiteSettings open={settingsOpen} onClose={()=>setSettingsOpen(false)}/><PlayerPanel open={playerOpen} onClose={()=>setPlayerOpen(false)} games={games} favorites={playerData.favorites} recent={playerData.recent} onPlay={go} onToggleFavorite={toggleFavorite} accountConfigured={auth.configured} accountName={auth.session?.user.user_metadata.display_name || auth.session?.user.email || ''} onAuth={()=>{setPlayerOpen(false);setAuthOpen(true);}} onSignOut={()=>{void auth.signOut();}}/>{auth.configured&&<Suspense fallback={null}><AuthModal open={authOpen||auth.recoveryMode} onClose={()=>{setAuthOpen(false);auth.dismissRecovery();}}/></Suspense>}<Suspense fallback={null}><HelpCenter open={helpOpen} onClose={()=>setHelpOpen(false)} onPlay={()=>{go('home');requestAnimationFrame(()=>document.getElementById('games')?.scrollIntoView({behavior:'smooth'}));}}/></Suspense>{homeConfirm&&<div className="exit-overlay"><div role="dialog" aria-modal="true" aria-labelledby="site-home-confirm"><h2 id="site-home-confirm">نرجع للرئيسية؟</h2><p>إذا بدأت جولة، العودة الآن تنهيها وتحذف نقاطها.</p><button autoFocus className="primary" onClick={()=>setHomeConfirm(false)}>نكمل هنا</button><button className="quiet" onClick={()=>go('home')}>إنهاء والعودة للرئيسية</button></div></div>}</div>;
}
