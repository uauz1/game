import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Cast, ChevronLeft, Trophy, Users, Sparkles, Brain, Camera, Search, Shuffle, Zap, UserRound, Puzzle, Gamepad2, Heart, Link2, Monitor, Settings as SettingsIcon, WandSparkles, Wifi, WifiOff, Flame, ShieldQuestion, RotateCcw, Share2, Check } from 'lucide-react';
import { readQaddhaPreferences, useQaddhaPreferences } from './utils/sitePreferences';
import type { PlayerActivity } from './components/party/PlayerPanel';
import { useAuth } from './contexts/AuthContext';
import { usePWA } from './hooks/usePWA';
import './arena.css';
import './newgames.css';
import './session.css';
import './extra-games.css';
import './final-games.css';
import './premium-games.css';
import './online-room.css';

const SiteSettings = lazy(() => import('./components/party/SiteSettings'));
const PlayerPanel = lazy(() => import('./components/party/PlayerPanel'));
const TeamGame = lazy(() => import('./components/party/TeamGame'));
const LettersGame = lazy(() => import('./components/party/LettersGame'));
const WhoAmIGame = lazy(() => import('./components/party/WhoAmIGame'));
const PhotoChallengeGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.PhotoChallengeGame })));
const WordBankGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.WordBankGame })));
const FastestGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.FastestGame })));
const CharacterGuessGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.CharacterGuessGame })));
const RiddlesGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.RiddlesGame })));
const FamilyFeudGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.FamilyFeudGame })));
const ConnectionGame = lazy(() => import('./components/party/NewPartyGames').then(module => ({ default: module.ConnectionGame })));
const AuctionGame = lazy(() => import('./components/party/ExtraPartyGames').then(module => ({ default: module.AuctionGame })));
const OrderGame = lazy(() => import('./components/party/ExtraPartyGames').then(module => ({ default: module.OrderGame })));
const FlashMemoryGame = lazy(() => import('./components/party/ExtraPartyGames').then(module => ({ default: module.FlashMemoryGame })));
const MissingGame = lazy(() => import('./components/party/ExtraPartyGames').then(module => ({ default: module.MissingGame })));
const SilentActingGame = lazy(() => import('./components/party/FinalPartyGames').then(module => ({ default: module.SilentActingGame })));
const SecretWordGame = lazy(() => import('./components/party/FinalPartyGames').then(module => ({ default: module.SecretWordGame })));
const PressureGame = lazy(() => import('./components/party/PremiumPartyGames').then(module => ({ default: module.PressureGame })));
const IntruderGame = lazy(() => import('./components/party/PremiumPartyGames').then(module => ({ default: module.IntruderGame })));
const FamilyHostController = lazy(() => import('./components/party/HostRoom').then(module => ({ default: module.FamilyHostController })));
const SmartPartySession = lazy(() => import('./components/party/SmartPartySession'));
const AuthModal = lazy(() => import('./components/party/AuthModal'));
const HelpCenter = lazy(() => import('./components/party/HelpCenter'));
const OnlineRoom = lazy(() => import('./components/party/OnlineRoom'));

const gamePrefetchers: Record<string, () => Promise<unknown>> = {
  teams: () => import('./components/party/TeamGame'),
  letters: () => import('./components/party/LettersGame'),
  who: () => import('./components/party/WhoAmIGame'),
  photo: () => import('./components/party/NewPartyGames'),
  words: () => import('./components/party/NewPartyGames'),
  fast: () => import('./components/party/NewPartyGames'),
  character: () => import('./components/party/NewPartyGames'),
  riddles: () => import('./components/party/NewPartyGames'),
  family: () => import('./components/party/NewPartyGames'),
  connection: () => import('./components/party/NewPartyGames'),
  auction: () => import('./components/party/ExtraPartyGames'),
  order: () => import('./components/party/ExtraPartyGames'),
  memory: () => import('./components/party/ExtraPartyGames'),
  missing: () => import('./components/party/ExtraPartyGames'),
  acting: () => import('./components/party/FinalPartyGames'),
  secret: () => import('./components/party/FinalPartyGames'),
  pressure: () => import('./components/party/PremiumPartyGames'),
  intruder: () => import('./components/party/PremiumPartyGames'),
};
const prefetchGame = (gameId: string) => { void gamePrefetchers[gameId]?.(); };

function GameLoading() {
  return <section className="game-loading" role="status" aria-live="polite"><Gamepad2/><span>نجهّز التحدّي…</span></section>;
}

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;

const games = [
  {id:'teams',title:'قدّها فرق',desc:'اختاروا الفئات. ارفعوا الرهان. وخلّوا المعرفة تحسمها.',icon:Users,tag:'فريقان + مقدم',cover:asset('teams-cover.jpg'),ready:true},
  {id:'letters',title:'حروف مع عزيز',desc:'حرف واحد، احتمالات كثيرة. مين يجيبها أول؟',icon:Sparkles,tag:'حروف + سرعة بديهة',cover:asset('letters-cover.jpg'),ready:true},
  {id:'who',title:'من أنا؟',desc:'شخصية غامضة وتلميحات تقرّبكم للحل.',icon:Brain,tag:'تخمين + خطف',cover:asset('who-cover.jpg'),ready:true},
  {id:'photo',title:'تحدي الصورة',desc:'التفاصيل الصغيرة تخبّي الإجابة الكبيرة.',icon:Camera,tag:'تحدّي بصري',cover:asset('photo-cover.jpg'),ready:true},
  {id:'words',title:'بنك الكلمات',desc:'اوصف الكلمة من غير ما تقول الكلمات الممنوعة.',icon:BookOpen,tag:'كلمات + وصف',cover:asset('word-bank-cover-wide.jpg'),ready:true},
  {id:'fast',title:'مين أسرع؟',desc:'لحظة واحدة تصنع الفارق.',icon:Zap,tag:'سرعة + زر',cover:asset('fastest-cover.jpg'),ready:true},
  {id:'character',title:'خمن الشخصية',desc:'تلميح وراء تلميح… من تكون؟',icon:UserRound,tag:'شخصيات',cover:asset('character-cover.jpg'),ready:true},
  {id:'riddles',title:'فوازير',desc:'فكّروا فيها سوا، الحل أقرب مما تتوقعون.',icon:Puzzle,tag:'ألغاز',cover:asset('riddles-cover.jpg'),ready:true},
  {id:'family',title:'تحدي العائلة',desc:'اكشفوا أشهر إجابات الجمهور واجمعوا النقاط.',icon:Trophy,tag:'إجابات جمهور',cover:asset('family-cover.jpg'),ready:true},
  {id:'connection',title:'وش الرابط؟',desc:'أربع إشارات تخفي رابطًا واحدًا… اكتشفوه بأقل تلميحات.',icon:Link2,tag:'ربط + سرعة بديهة',cover:asset('connection-cover.jpg'),ready:true},
  {id:'auction',title:'المزاد',desc:'زايدوا على عدد الإجابات… والفريق اللي يرسو عليه المزاد لازم يثبتها.',icon:Trophy,tag:'فرق + مخاطرة',cover:asset('auction-cover-v2.webp'),ready:true},
  {id:'order',title:'رتّبها',desc:'أربعة عناصر مبعثرة. رتبوها صح قبل ما يضيع عليكم النقطة.',icon:Sparkles,tag:'ترتيب + معرفة',cover:asset('order-cover-v2.webp'),ready:true},
  {id:'memory',title:'ذاكرة البرق',desc:'ثواني للحفظ، وبعدها رجّعوا التسلسل بنفس الترتيب.',icon:Brain,tag:'ذاكرة + تركيز',cover:asset('memory-cover-v2.webp'),ready:true},
  {id:'missing',title:'وش الناقص؟',desc:'ركزوا في العناصر… نخفي واحد ومهمتكم تعرفونه بسرعة.',icon:Search,tag:'ملاحظة + ذاكرة',cover:asset('missing-cover-v2.webp'),ready:true},
  {id:'acting',title:'مثّلها',desc:'تمثيل صامت، وقت يركض، وفريق يحاول يلقطها.',icon:Gamepad2,tag:'تمثيل + فرق',cover:asset('acting-cover-v2.webp'),ready:true},
  {id:'secret',title:'الكلمة السرّية',desc:'الكل يعرف المكان إلا المتخفي… اكشفوه قبل ما يندمج.',icon:Users,tag:'خداع + نقاش',cover:asset('secret-cover-v2.webp'),ready:true},
  {id:'pressure',title:'تحت الضغط',desc:'عدد محدد من الإجابات ووقت يركض. هل تقدرون تكملون قبل الصافرة؟',icon:Flame,tag:'سرعة + معرفة',cover:asset('pressure-cover-v4.webp'),ready:true},
  {id:'intruder',title:'الدخيل',desc:'أربع اختيارات بينها عنصر واحد ما ينتمي للباقي. اكتشفوه وفسّروا السبب.',icon:ShieldQuestion,tag:'ذكاء + استنتاج',cover:asset('intruder-cover-v4.webp'),ready:true},
];
const gameGroups: Record<string,string> = {teams:'جماعية',letters:'كلمات',who:'تخمين',photo:'تحديات',words:'كلمات',fast:'سريعة',character:'تخمين',riddles:'تحديات',family:'جماعية',connection:'تخمين',auction:'جماعية',order:'تحديات',memory:'سريعة',missing:'سريعة',acting:'جماعية',secret:'جماعية',pressure:'سريعة',intruder:'تحديات'};
const quickModes = [
  { id:'quick', title:'سريع وخفيف', subtitle:'للجمعة اللي تبغى تبدأ فورًا', icon:Zap, pool:['fast','memory','missing','pressure'] },
  { id:'teams', title:'فرق وحماس', subtitle:'تنافس واضح بين فريقين', icon:Users, pool:['teams','letters','family','auction','acting'] },
  { id:'smart', title:'فكر وخمّن', subtitle:'ألغاز وشخصيات واستنتاج', icon:Brain, pool:['who','character','riddles','connection','intruder'] },
] as const;
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
  const [screen,setScreen]=useState(()=>{const requested=new URLSearchParams(window.location.search).get('play')||'';return games.some(game=>game.id===requested)?requested:'home';});
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [playerOpen,setPlayerOpen]=useState(false);
  const [authOpen,setAuthOpen]=useState(false);
  const [helpOpen,setHelpOpen]=useState(false);
  const [homeConfirm,setHomeConfirm]=useState(false);
  const [offline,setOffline]=useState(()=>typeof navigator!=='undefined' ? !navigator.onLine : false);
  const [sharedGame,setSharedGame]=useState('');
  const [gameSearch,setGameSearch]=useState('');
  const [gameFilter,setGameFilter]=useState('الكل');
  const gameSearchRef=useRef<HTMLInputElement|null>(null);
  const [lastGame,setLastGame]=useState(()=>{try{return localStorage.getItem('qaddha.last-game')||''}catch{return ''}});
  const [playerData,setPlayerData]=useState(readPlayerData);
  const auth=useAuth();
  useEffect(()=>{if(auth.oauthMessage)setAuthOpen(true);},[auth.oauthMessage]);
  useQaddhaPreferences();
  usePWA();
  useEffect(()=>{
    const online=()=>setOffline(false);
    const offlineHandler=()=>setOffline(true);
    window.addEventListener('online',online);
    window.addEventListener('offline',offlineHandler);
    return()=>{
      window.removeEventListener('online',online);
      window.removeEventListener('offline',offlineHandler);
    };
  },[]);
  const savePlayerData=(next:typeof playerData)=>{setPlayerData(next);try{localStorage.setItem(PLAYER_KEY,JSON.stringify(next))}catch{/* Guest history stays available for this visit. */}};
  const go=(next:string)=>{if(games.some(game=>game.id===next)){setLastGame(next);const recent=[{gameId:next,playedAt:Date.now()},...playerData.recent.filter(item=>item.gameId!==next)].slice(0,8);savePlayerData({...playerData,recent});try{localStorage.setItem('qaddha.last-game',next)}catch{/* Recent game is optional. */}}setHomeConfirm(false);setScreen(next);const url=new URL(window.location.href);if(games.some(game=>game.id===next))url.searchParams.set('play',next);else url.searchParams.delete('play');window.history.pushState({qaddhaScreen:next},'',url);window.scrollTo({top:0,behavior:'instant'});};
  const toggleFavorite=(gameId:string)=>{const favorites=playerData.favorites.includes(gameId)?playerData.favorites.filter(id=>id!==gameId):[...playerData.favorites,gameId];savePlayerData({...playerData,favorites});};
  const shareGame=async(gameId:string)=>{
    const game=games.find(item=>item.id===gameId);
    if(!game)return;
    const url=new URL(window.location.href);
    url.search='';
    url.searchParams.set('play',gameId);
    try{
      if(navigator.share)await navigator.share({title:`${game.title} · قدّها`,text:`جرّب ${game.title} في قدّها`,url:url.toString()});
      else await navigator.clipboard.writeText(url.toString());
      setSharedGame(gameId);
      window.setTimeout(()=>setSharedGame(current=>current===gameId?'':current),1500);
    }catch{/* User cancelled share or clipboard is unavailable. */}
  };
  const isGame=games.some(game=>game.id===screen);
  useEffect(()=>{
    const syncFromHistory=()=>{
      const requested=new URLSearchParams(window.location.search).get('play')||'';
      const next=games.some(game=>game.id===requested)?requested:'home';
      const playingNow=games.some(game=>game.id===screen);
      if(playingNow&&next==='home'&&readQaddhaPreferences().confirmExit){
        const restoreUrl=new URL(window.location.href);
        restoreUrl.searchParams.set('play',screen);
        window.history.pushState({qaddhaScreen:screen},'',restoreUrl);
        setHomeConfirm(true);
        return;
      }
      setHomeConfirm(false);
      setScreen(next);
      window.scrollTo({top:0,behavior:'instant'});
    };
    window.addEventListener('popstate',syncFromHistory);
    return()=>window.removeEventListener('popstate',syncFromHistory);
  },[screen]);
  useEffect(()=>{
    if(!isGame||!readQaddhaPreferences().confirmExit)return;
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
  const filteredGames=useMemo(()=>{
    const query=gameSearch.trim();
    const recentIds=new Set(playerData.recent.map(item=>item.gameId));
    return games.filter(game=>{
      const filterMatch=gameFilter==='الكل'
        || gameGroups[game.id]===gameFilter
        || (gameFilter==='المفضلة'&&playerData.favorites.includes(game.id))
        || (gameFilter==='حديثًا'&&recentIds.has(game.id));
      return filterMatch&&(!query||`${game.title} ${game.desc} ${game.tag}`.includes(query));
    });
  },[gameFilter,gameSearch,playerData.favorites,playerData.recent]);
  const favoriteGames=useMemo(()=>playerData.favorites.map(id=>games.find(game=>game.id===id)).filter((game): game is (typeof games)[number]=>Boolean(game)).slice(0,6),[playerData.favorites]);
  const recentGames=useMemo(()=>playerData.recent.map(item=>games.find(game=>game.id===item.gameId)).filter((game): game is (typeof games)[number]=>Boolean(game)).slice(0,5),[playerData.recent]);
  const randomGame=(pool=games)=>{const choices=pool.length?pool:games;go(choices[Math.floor(Math.random()*choices.length)].id);};
  useEffect(()=>{
    if(screen!=='home')return;
    const keyboard=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      const typing=target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target?.isContentEditable;
      if(event.key==='/'&&!typing){
        event.preventDefault();
        gameSearchRef.current?.focus();
        document.getElementById('games')?.scrollIntoView({behavior:'smooth',block:'start'});
      }else if(event.key==='Escape'&&document.activeElement===gameSearchRef.current){
        setGameSearch('');
        gameSearchRef.current?.blur();
      }
    };
    window.addEventListener('keydown',keyboard);
    return()=>window.removeEventListener('keydown',keyboard);
  },[screen]);
  const hostParams=useMemo(()=>new URLSearchParams(window.location.search),[]);
  const onlineEmbed=hostParams.get('onlineEmbed')==='1';
  const gameHome=()=>{ if(!onlineEmbed)setHomeConfirm(true); };

  if(hostParams.get('host')==='family')return <div className="app party-app host-app" dir="rtl"><Suspense fallback={<GameLoading/>}><FamilyHostController roomId={hostParams.get('room')||''} token={hostParams.get('token')||''}/></Suspense></div>;
  if(hostParams.has('online')||hostParams.has('onlineHost'))return <div className="app party-app" dir="rtl"><Suspense fallback={<GameLoading/>}><OnlineRoom games={games.map(({id,title,tag})=>({id,title,tag}))} onBack={()=>{window.location.href=window.location.pathname;}} onRequireAuth={()=>setAuthOpen(true)} accountName={auth.session?.user.user_metadata.display_name || auth.session?.user.email || ''}/></Suspense>{auth.configured&&<Suspense fallback={null}><AuthModal open={authOpen||auth.recoveryMode} onClose={()=>{setAuthOpen(false);auth.dismissRecovery();auth.clearOauthMessage();}}/></Suspense>}</div>;

  return <div className={`app party-app ${onlineEmbed?'online-embed':''}`} dir="rtl">{!onlineEmbed&&offline&&<div className="site-status-banner offline" role="status"><WifiOff size={16}/><span>أنت بدون اتصال الآن. الألعاب المحلية شغالة، والأونلاين يرجع تلقائيًا لما يرجع النت.</span></div>}<div className="tv-orientation-hint" role="status"><Cast aria-hidden="true"/><span><b>عرض التلفزيون جاهز</b> لفّ الجوال بالعرض ثم فعّل ملء الشاشة لأفضل نتيجة.</span></div><header className="topbar"><button className="brand" aria-label="قدّها الرئيسية" onClick={()=>{if(screen==='home')window.scrollTo({top:0,behavior:'smooth'});else if(isGame&&readQaddhaPreferences().confirmExit)setHomeConfirm(true);else go('home');}} style={{padding:0,background:'transparent',border:0,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'12px',minWidth:'190px'}}>
    <span aria-hidden="true" style={{width:'56px',height:'56px',borderRadius:'17px',display:'grid',placeItems:'center',position:'relative',flex:'0 0 auto',background:'linear-gradient(145deg,#080808,#1a1a1a)',border:'1px solid #d7a93b',boxShadow:'inset 0 0 0 1px #f5d36a22,0 8px 22px #0008,0 0 24px #d7a93b18'}}>
      <Gamepad2 size={34} strokeWidth={1.9} style={{color:'#e7bc4f',filter:'drop-shadow(0 1px 3px #000)'}}/>
      <span style={{position:'absolute',top:'6px',right:'7px',width:'6px',height:'6px',borderRadius:'50%',background:'#f4d36f',boxShadow:'-9px 2px 0 #c99428'}}/>
    </span>
    <span style={{display:'flex',flexDirection:'column',alignItems:'flex-start',lineHeight:1}}>
      <span style={{fontFamily:'Tajawal,Cairo,sans-serif',fontSize:'30px',fontWeight:900,letterSpacing:'-.8px',background:'linear-gradient(180deg,#fff2b0 0%,#e9ba47 45%,#a87519_100%)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',textShadow:'0 2px 12px #d7a93b20'}}>قدّها</span>
      <span style={{fontFamily:'Tajawal,Cairo,sans-serif',fontSize:'9px',fontWeight:700,letterSpacing:'.2px',marginTop:'6px',color:'#b99a55'}}>ألعاب تجمعنا أكثر</span>
    </span>
  </button><span className="topbar-caption">للجمعة اللي تستاهل</span><div className="topbar-actions"><span className="local-play"><Monitor size={16}/> شاشة واحدة · حماس الجميع</span><button className="header-profile-button" onClick={()=>setPlayerOpen(true)} aria-label="ملف اللاعب"><UserRound size={18}/><span>{auth.session?.user.user_metadata.display_name || auth.session?.user.email?.split('@')[0] || 'ضيف'}</span></button><button className="header-settings-button" onClick={()=>setSettingsOpen(true)} aria-label="إعدادات قدّها"><SettingsIcon size={18}/><span>الإعدادات</span></button></div></header><main><Suspense fallback={<GameLoading/>}>
    {screen==='teams'?<TeamGame onHome={gameHome}/>:screen==='letters'?<LettersGame onHome={gameHome}/>:screen==='who'?<WhoAmIGame onHome={gameHome}/>:screen==='photo'?<PhotoChallengeGame onHome={gameHome}/>:screen==='words'?<WordBankGame onHome={gameHome}/>:screen==='fast'?<FastestGame onHome={gameHome}/>:screen==='character'?<CharacterGuessGame onHome={gameHome}/>:screen==='riddles'?<RiddlesGame onHome={gameHome}/>:screen==='family'?<FamilyFeudGame onHome={gameHome}/>:screen==='connection'?<ConnectionGame onHome={gameHome}/>:screen==='auction'?<AuctionGame onHome={gameHome}/>:screen==='order'?<OrderGame onHome={gameHome}/>:screen==='memory'?<FlashMemoryGame onHome={gameHome}/>:screen==='missing'?<MissingGame onHome={gameHome}/>:screen==='acting'?<SilentActingGame onHome={gameHome}/>:screen==='secret'?<SecretWordGame onHome={gameHome}/>:screen==='pressure'?<PressureGame onHome={gameHome}/>:screen==='intruder'?<IntruderGame onHome={gameHome}/>:screen==='session'?<SmartPartySession games={games.map(({id,title,tag})=>({id,title,tag}))} onBack={()=>go('home')} onPlay={go}/>:screen==='online'?<OnlineRoom games={games.map(({id,title,tag})=>({id,title,tag}))} onBack={()=>go('home')} onRequireAuth={()=>setAuthOpen(true)} accountName={auth.session?.user.user_metadata.display_name || auth.session?.user.email || ''}/>:<>
      <section className="lobby-hero"><div className="lobby-copy"><span className="eyebrow"><Sparkles size={15}/> افتحها… واجمعهم</span><h1>الجمعة عليكم.<br/><em>والتحدّي علينا.</em></h1><p>حوّلوا جلستكم إلى ساحة منافسة. فريقان، ضحكة، وسؤال يقلب الموازين… مين فيكم قدّها؟</p><div className="hero-actions"><button className="primary" onClick={()=>go('teams')}>ابدأ تحدّي الفرق <ChevronLeft size={19}/></button><button className="quiet online-hero-cta" onClick={()=>go('online')}><Wifi size={17}/> لعب أونلاين</button><button className="quiet smart-session-cta" onClick={()=>go('session')}><WandSparkles size={17}/> رتّب لنا جلسة</button><button className="quiet" onClick={()=>randomGame()}><Shuffle size={17}/> اختاروا لنا</button><a href="#games" className="quiet">شوف الألعاب <ArrowLeft size={17}/></a>{lastGame&&<button className="quiet recent-game" onClick={()=>go(lastGame)}>كمّل: {games.find(game=>game.id===lastGame)?.title}</button>}</div><div className="hero-details"><span>بدون تسجيل</span><i/><span>للجوال والشاشة الكبيرة</span><i/><span>بالعربي، طبعًا</span></div></div><div className="arena-illustration cinematic-arena" aria-hidden="true"><img src={asset('qaddha-majlis-hero.webp')} alt="" decoding="async" fetchPriority="high"/><span className="cinematic-sheen"/></div></section>
      <section className="lobby-launchpad" aria-label="اختصارات اللعب">
        <div className="launchpad-head"><div><small>ابدأ بالطريقة اللي تناسب جمعتكم</small><h2>دخول أسرع للّعب</h2></div><button className="quiet" onClick={()=>go('online')}><Wifi size={17}/> افتح غرفة أونلاين</button></div>
        <div className="quick-mode-grid">{quickModes.map(mode=>{const Icon=mode.icon;return <button key={mode.id} onClick={()=>randomGame(games.filter(game=>(mode.pool as readonly string[]).includes(game.id)))}><span><Icon/></span><div><b>{mode.title}</b><small>{mode.subtitle}</small></div><ChevronLeft/></button>})}</div>
        {(recentGames.length>0||favoriteGames.length>0)&&<div className="personal-game-shelves">
          {recentGames.length>0&&<div><div className="shelf-title"><span><RotateCcw size={16}/> لعبت مؤخرًا</span><small>ارجع لها بضغطة</small></div><div className="game-chip-row">{recentGames.map(game=><button key={game.id} onMouseEnter={()=>prefetchGame(game.id)} onFocus={()=>prefetchGame(game.id)} onTouchStart={()=>prefetchGame(game.id)} onClick={()=>go(game.id)}><img src={game.cover} alt="" loading="lazy"/><span>{game.title}</span></button>)}</div></div>}
          {favoriteGames.length>0&&<div><div className="shelf-title"><span><Heart size={16} fill="currentColor"/> مفضلتك</span><small>ألعابك المحفوظة</small></div><div className="game-chip-row">{favoriteGames.map(game=><button key={game.id} onMouseEnter={()=>prefetchGame(game.id)} onFocus={()=>prefetchGame(game.id)} onTouchStart={()=>prefetchGame(game.id)} onClick={()=>go(game.id)}><img src={game.cover} alt="" loading="lazy"/><span>{game.title}</span></button>)}</div></div>}
        </div>}
      </section>
      <section id="games" className="lobby-games"><div className="section-head"><div><small>كل جمعة لها جوّها</small><h2>اختاروا التحدّي</h2></div><span>{filteredGames.length===games.length?`${games.length} ألعاب جاهزة الآن`:`${filteredGames.length} من ${games.length} ألعاب`}</span></div><div className="game-library-tools"><label><Search/><input ref={gameSearchRef} aria-label="البحث في الألعاب" placeholder="ابحث بالاسم أو نوع التحدّي…  /" value={gameSearch} onChange={event=>setGameSearch(event.target.value)}/></label><div>{['الكل','المفضلة','حديثًا','جماعية','سريعة','تحديات','كلمات','تخمين'].map(group=><button key={group} aria-pressed={gameFilter===group} className={gameFilter===group?'active':''} onClick={()=>setGameFilter(group)}>{group}</button>)}</div><button className="random-game" disabled={!filteredGames.length} onClick={()=>randomGame(filteredGames)}><Shuffle/> اختيار عشوائي من النتائج</button></div>{filteredGames.length?<div className="lobby-grid">{filteredGames.map((g)=>{const i=games.findIndex(game=>game.id===g.id);const favorite=playerData.favorites.includes(g.id);return <div className="game-card-shell" key={g.id}><button className={`lobby-game game-${g.id} ${g.ready?'available':'upcoming'}`} disabled={!g.ready} onMouseEnter={()=>prefetchGame(g.id)} onFocus={()=>prefetchGame(g.id)} onTouchStart={()=>prefetchGame(g.id)} onClick={()=>go(g.id)}><div className="game-art"><span className="game-number">{String(i+1).padStart(2,'0')}</span><img className="game-cover-image" src={g.cover} alt="" loading={i < 4 ? 'eager' : 'lazy'} fetchPriority={i < 2 ? 'high' : 'auto'} decoding="async" width="960" height="540"/><span className="cover-spark">✦</span><span className="game-status">العب الآن</span></div><div className="game-copy"><small>{g.tag}</small><h3>{g.title}</h3><p>{g.desc}</p><span className="game-arrow"><ArrowLeft size={20}/></span></div></button><div className="game-card-actions"><button className={`game-favorite ${favorite?'active':''}`} aria-pressed={favorite} aria-label={`${favorite?'إزالة':'إضافة'} ${g.title} ${favorite?'من':'إلى'} المفضلة`} onClick={()=>toggleFavorite(g.id)}><Heart fill={favorite?'currentColor':'none'}/></button><button className={`game-share ${sharedGame===g.id?'done':''}`} aria-label={`مشاركة ${g.title}`} onClick={()=>void shareGame(g.id)}>{sharedGame===g.id?<Check/>:<Share2/>}</button></div></div>})}</div>:<div className="category-empty"><Search/><h3>ما لقينا لعبة بهذا الاسم</h3><p>امسح البحث أو اختر تصنيفًا ثانيًا.</p><button className="quiet" onClick={()=>{setGameSearch('');setGameFilter('الكل');}}>عرض كل الألعاب</button></div>}</section><section className="lobby-how"><Gamepad2/><div><h2>ثلاث خطوات… وتبدأ السالفة.</h2><p>كوّنوا فريقين، اختاروا تحدّيكم، وخلو واحد يمسك التقديم والتحكيم.</p></div><button className="secondary" onClick={()=>go('session')}>خلّ قدّها يرتب الجلسة</button></section>
    </>}
  </Suspense></main><footer><span>قدّها <b>✦</b></span><p>جمعتكم أحلى بالتحدّي</p><button onClick={()=>setHelpOpen(true)}>طريقة اللعب · الخصوصية · المساعدة</button></footer><Suspense fallback={null}><SiteSettings open={settingsOpen} onClose={()=>setSettingsOpen(false)}/></Suspense><Suspense fallback={null}><PlayerPanel open={playerOpen} onClose={()=>setPlayerOpen(false)} games={games} favorites={playerData.favorites} recent={playerData.recent} onPlay={go} onToggleFavorite={toggleFavorite} accountConfigured={auth.configured} accountName={auth.session?.user.user_metadata.display_name || auth.session?.user.email || ''} onAuth={()=>{setPlayerOpen(false);setAuthOpen(true);}} onSignOut={()=>{void auth.signOut();}}/></Suspense>{auth.configured&&<Suspense fallback={null}><AuthModal open={authOpen||auth.recoveryMode} onClose={()=>{setAuthOpen(false);auth.dismissRecovery();auth.clearOauthMessage();}}/></Suspense>}<Suspense fallback={null}><HelpCenter open={helpOpen} onClose={()=>setHelpOpen(false)} onPlay={()=>{go('home');requestAnimationFrame(()=>document.getElementById('games')?.scrollIntoView({behavior:'smooth'}));}}/></Suspense>{homeConfirm&&<div className="exit-overlay"><div role="dialog" aria-modal="true" aria-labelledby="site-home-confirm"><h2 id="site-home-confirm">نرجع للرئيسية؟</h2><p>العودة قد تنهي الجولة الحالية. بعض الألعاب تحفظ تقدمك تلقائيًا، لكن الأفضل ترجع بعد نهاية الجولة.</p><button autoFocus className="primary" onClick={()=>setHomeConfirm(false)}>نكمل هنا</button><button className="quiet" onClick={()=>go('home')}>إنهاء والعودة للرئيسية</button></div></div>}</div>;
}
