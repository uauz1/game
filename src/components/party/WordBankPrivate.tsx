import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import { ArrowLeft, Check, Copy, FastForward, Flag, Gamepad2, Link2, RefreshCw, RotateCcw, Smartphone, Sparkles, Trophy, Users, Wifi, WifiOff } from 'lucide-react';
import { wordCards } from '../../data/newPartyGames';
import { drawWithoutRepeats } from '../../utils/newGameRotation';
import { useNewGameNumber } from '../../utils/newGameSettings';
import { loadSharedTeams, saveSharedTeams } from '../../utils/sharedTeams';
import { loadHuroofPreferences } from '../../utils/huroofStorage';
import { buildJoinUrl, createJoinQr, createRoomId, createRoomToken, isValidRoomId, isValidRoomToken, peerOptions } from '../../utils/peerRoom';
import Countdown from './Countdown';

type Team = { name: string; color: string; score: number };
type WordCard = (typeof wordCards)[number];
type Phase = 'setup' | 'play' | 'result';
type RoomStatus = 'starting' | 'ready' | 'connecting' | 'connected' | 'disconnected' | 'error';
type WordCommand = { type: 'correct' } | { type: 'skip' };
type WordPrivateState = {
  type: 'word-private-state';
  phase: Phase;
  round: number;
  totalRounds: number;
  seconds: number;
  activeTeam: number;
  teams: Team[];
  card: { word: string; taboo: string[]; category: string } | null;
};

const colors = ['#45b6ff', '#ff70b5', '#a77bff', '#ffd45a'];

function initialTeams(): Team[] {
  const shared = loadSharedTeams();
  if (shared) return shared.map(team => ({ ...team, score: 0 }));
  const saved = loadHuroofPreferences();
  return [
    { name: saved.teamNames[0], color: saved.teamColors[0], score: 0 },
    { name: saved.teamNames[1], color: saved.teamColors[1], score: 0 },
  ];
}

function useWordPrivateRoom(state: WordPrivateState, onCommand: (command: WordCommand) => void) {
  const [status, setStatus] = useState<RoomStatus>('starting');
  const [hostUrl, setHostUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const connectionRef = useRef<DataConnection | null>(null);
  const stateRef = useRef(state);
  const commandRef = useRef(onCommand);
  stateRef.current = state;
  commandRef.current = onCommand;

  useEffect(() => {
    const token = createRoomToken();
    const peerId = createRoomId('words');
    const peer = new Peer(peerId, peerOptions);
    peer.on('open', () => {
      const nextUrl = buildJoinUrl('words', peerId, token);
      setHostUrl(nextUrl);
      setStatus('ready');
      createJoinQr(nextUrl).then(setQrCode).catch(() => setStatus('error'));
    });
    peer.on('connection', connection => {
      const metadata = connection.metadata as { token?: string; game?: string } | undefined;
      if (metadata?.token !== token || metadata?.game !== 'words') { connection.close(); return; }
      connectionRef.current?.close();
      connectionRef.current = connection;
      setStatus('connecting');
      connection.on('open', () => { setStatus('connected'); connection.send(stateRef.current); });
      connection.on('data', payload => {
        if (!payload || typeof payload !== 'object') return;
        const command = payload as Partial<WordCommand>;
        if (command.type === 'correct' || command.type === 'skip') commandRef.current({ type: command.type });
      });
      connection.on('close', () => { if (connectionRef.current === connection) connectionRef.current = null; setStatus('disconnected'); });
      connection.on('error', () => setStatus('disconnected'));
    });
    peer.on('disconnected', () => { setStatus('disconnected'); if (!peer.destroyed) { try { peer.reconnect(); } catch { /* retry from UI */ } } });
    peer.on('error', () => setStatus('error'));
    return () => { connectionRef.current?.close(); peer.destroy(); };
  }, []);

  useEffect(() => { if (connectionRef.current?.open) connectionRef.current.send(state); }, [state]);
  return { status, hostUrl, qrCode };
}

function Pairing({ status, hostUrl, qrCode, compact = false }: { status: RoomStatus; hostUrl: string; qrCode: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const connected = status === 'connected';
  const copy = async () => {
    if (!hostUrl) return;
    try { await navigator.clipboard?.writeText(hostUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* QR remains available. */ }
  };
  if (compact) return <div className={`host-link-compact ${connected ? 'connected' : ''}`}>{connected ? <Wifi/> : <WifiOff/>}<div><b>{connected ? 'جوال الموصّف متصل' : 'جوال الموصّف غير متصل'}</b><small>{connected ? 'الكلمة والممنوعات ظاهرة على الجوال فقط' : 'ارجع للإعدادات وامسح QR مجددًا'}</small></div></div>;
  return <section className="host-pairing" aria-live="polite"><div className="host-pairing-copy"><span><Smartphone/> شاشة الموصّف السرية</span><h3>امسح QR بالجوال</h3><p>عدّلنا الرمز ليكون أقصر وعالي التباين وأسهل للكاميرا. بعد الفتح انتظر حتى تظهر كلمة <b>متصل</b>.</p><div className={`host-connection ${connected ? 'connected' : ''}`}>{connected ? <Wifi/> : <RefreshCw className={status === 'starting' || status === 'connecting' || status === 'disconnected' ? 'spin' : ''}/>}<b>{connected ? 'تم اتصال جوال الموصّف' : status === 'error' ? 'تعذر إنشاء الغرفة · حدّث الصفحة' : status === 'disconnected' ? 'نعيد الاتصال تلقائيًا…' : 'بانتظار اتصال الجوال'}</b></div><button className="quiet host-copy" disabled={!hostUrl} onClick={copy}>{copied ? <Check/> : <Copy/>}{copied ? 'تم نسخ الرابط' : 'نسخ رابط الجوال'}</button>{hostUrl ? <a className="quiet host-copy" href={hostUrl} target="_blank" rel="noreferrer">فتح رابط الجوال للتجربة <Link2/></a> : null}</div><div className="host-qr">{qrCode ? <img src={qrCode} alt="رمز QR لشاشة موصّف بنك الكلمات"/> : <div className="qr-loading"><RefreshCw className="spin"/><span>نجهز الغرفة…</span></div>}</div></section>;
}

export default function WordBankPrivate({ onHome }: { onHome: () => void }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [seconds, setSeconds] = useNewGameNumber('words', 'seconds', 45);
  const [rounds, setRounds] = useNewGameNumber('words', 'rounds', 8);
  const [deck, setDeck] = useState<WordCard[]>(wordCards);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>('setup');
  const [timedOut, setTimedOut] = useState(false);
  const active = round % 2;
  const card = deck[round] ?? null;
  const valid = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();

  const advance = (correct: boolean) => {
    if (phase !== 'play') return;
    if (correct && !timedOut) setTeams(current => current.map((team, index) => index === active ? { ...team, score: team.score + 100 } : team));
    if (round + 1 >= deck.length) { setPhase('result'); return; }
    setRound(value => value + 1);
    setTimedOut(false);
  };

  const privateState: WordPrivateState = {
    type: 'word-private-state', phase, round, totalRounds: deck.length, seconds, activeTeam: active, teams,
    card: phase === 'play' && card ? { word: card.word, taboo: card.taboo, category: card.category } : null,
  };
  const room = useWordPrivateRoom(privateState, command => advance(command.type === 'correct'));

  const updateTeam = (index: number, patch: Partial<Team>) => setTeams(current => current.map((team, teamIndex) => teamIndex === index ? { ...team, ...patch } : team));
  const start = () => {
    if (!valid || room.status !== 'connected') return;
    const prepared = teams.map(team => ({ ...team, name: team.name.trim(), score: 0 }));
    saveSharedTeams(prepared);
    setTeams(prepared);
    setDeck(drawWithoutRepeats('words', wordCards, rounds, item => item.id));
    setRound(0); setTimedOut(false); setPhase('play');
  };
  const replay = () => { setDeck(drawWithoutRepeats('words', wordCards, rounds, item => item.id)); setTeams(current => current.map(team => ({ ...team, score: 0 }))); setRound(0); setTimedOut(false); setPhase('play'); };
  const winner = teams[0].score === teams[1].score ? null : teams[0].score > teams[1].score ? 0 : 1;

  return <section className="arena new-game word-game">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={15}/> بنك الكلمات</span><h1>{phase === 'setup' ? 'سرّ الموصّف في جواله.' : phase === 'result' ? 'خلص رصيد الكلمات!' : `دور ${teams[active].name}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>
    {phase === 'setup' ? <div className="new-game-setup">
      <div className="section-heading"><h2>جهّزوا الفريقين والجوال السري</h2><p>واحد من الفريق الحالي يمسح QR. هو الوحيد اللي يشوف الكلمة والممنوعات ويشرح لفريقه.</p></div>
      <div className="team-setup">{teams.map((team,index)=><div className="team-editor compact-team" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users/><span>0{index+1}</span></div><label>اسم الفريق {index===0?'الأول':'الثاني'}</label><input maxLength={22} value={team.name} onChange={event=>updateTeam(index,{name:event.target.value})}/><div className="color-choices">{colors.map(color=><button key={color} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>updateTeam(index,{color})}>{team.color===color?<Check size={16}/>:null}</button>)}</div></div>)}</div>
      <div className="match-settings new-game-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة الكلمة<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>عدد الكلمات<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={4}>4 كلمات</option><option value={6}>6 كلمات</option><option value={8}>8 كلمات</option></select></label></div>
      <Pairing {...room}/>
      {!valid ? <p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p> : room.status !== 'connected' ? <p className="validation">وصّل جوال الموصّف أولًا عشان ما تنكشف الكلمات على الشاشة.</p> : null}
      <div className="arena-actions"><span>الشاشة الكبيرة تعرض الوقت والنقاط فقط. كل الأسرار تبقى على الجوال.</span><button className="primary" disabled={!valid || room.status !== 'connected'} onClick={start}>ابدأوا التحدّي <Flag size={18}/></button></div>
    </div> : phase === 'result' ? <div className="new-result"><Trophy/><span className="eyebrow">أبطال الوصف</span><h2>{winner===null?'تعادل… كلكم قدّها!':`${teams[winner].name}… قدّها!`}</h2><div className="new-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><b>{team.name}</b><strong>{team.score}</strong></span>)}</div><div className="result-actions"><button className="primary" onClick={replay}><RotateCcw/> إعادة بنفس الإعدادات</button><button className="secondary" onClick={()=>setPhase('setup')}>تعديل الإعدادات</button></div></div> : <>
      <Pairing {...room} compact/>
      <div className="new-scorebar">{teams.map((team,index)=><div key={team.name} className={active===index?'active':''} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong></div>)}<p>الكلمة <b>{round+1}</b> / {deck.length}</p></div>
      <div className="new-stage word-stage" style={{textAlign:'center'}}><div className="word-vault">◆</div><span className="game-chip">خاص بالموصّف</span><h2>الكلمة مخفية عن الشاشة</h2><p>الموصّف من <b>{teams[active].name}</b> يشوف الكلمة والممنوعات على جواله فقط.</p><Countdown key={`${card?.id}-${round}`} seconds={seconds} stopped={timedOut} onExpire={()=>{setTimedOut(true); window.setTimeout(()=>advance(false),500);}}/><div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10,width:'min(560px,100%)',margin:'16px auto 0'}}><span><b>{round+1}</b><small style={{display:'block'}}>الكلمة الحالية</small></span><span><b>{teams[active].name}</b><small style={{display:'block'}}>الفريق</small></span><span><b>{room.status==='connected'?'متصل':'غير متصل'}</b><small style={{display:'block'}}>جوال الموصّف</small></span></div></div>
    </>}
  </section>;
}

export function WordBankPhone({ roomId, token }: { roomId: string; token: string }) {
  const [status, setStatus] = useState<'connecting'|'connected'|'disconnected'|'error'>('connecting');
  const [game, setGame] = useState<WordPrivateState | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  useEffect(() => {
    if (!isValidRoomId(roomId, 'words') || !isValidRoomToken(token)) { setStatus('error'); return; }
    const peer = new Peer(peerOptions); let stopped = false; let retryTimer = 0;
    const connect = () => {
      if (stopped || peer.destroyed) return; setStatus('connecting');
      const connection = peer.connect(roomId, { reliable: true, serialization: 'json', metadata: { token, game: 'words' } });
      connectionRef.current = connection;
      connection.on('open', () => setStatus('connected'));
      connection.on('data', payload => { if (payload && typeof payload === 'object' && (payload as WordPrivateState).type === 'word-private-state') setGame(payload as WordPrivateState); });
      connection.on('close', () => { if (stopped) return; setStatus('disconnected'); retryTimer = window.setTimeout(connect, 1500); });
      connection.on('error', () => { if (stopped) return; setStatus('disconnected'); retryTimer = window.setTimeout(connect, 1500); });
    };
    peer.on('open', connect);
    peer.on('disconnected', () => { if (stopped || peer.destroyed) return; setStatus('disconnected'); try { peer.reconnect(); } catch { retryTimer = window.setTimeout(connect, 1500); } });
    peer.on('error', error => { if (error.type === 'peer-unavailable' || error.type === 'network' || error.type === 'socket-closed') retryTimer = window.setTimeout(connect, 1500); else setStatus('error'); });
    return () => { stopped = true; window.clearTimeout(retryTimer); connectionRef.current?.close(); peer.destroy(); };
  }, [roomId, token]);
  const send = (command: WordCommand) => { if (connectionRef.current?.open) connectionRef.current.send(command); };
  const activeTeam = game?.teams[game.activeTeam];

  return <main className="mobile-host" dir="rtl"><header><span className="host-brand"><Gamepad2/> قدّها</span><span className={`mobile-host-status ${status}`}>{status==='connected'?<Wifi/>:<WifiOff/>}{status==='connected'?'متصل بالشاشة':status==='error'?'الرابط غير صالح':'جاري الاتصال…'}</span></header>
    {!game ? <section className="host-wait"><Link2/><h1>{status==='error'?'تعذر فتح غرفة بنك الكلمات':'نربط جوالك بالشاشة…'}</h1><p>{status==='error'?'ارجع للشاشة الكبيرة وامسح QR الجديد.':'خل الصفحة مفتوحة. إذا كان الكمبيوتر والجوال على نفس الواي فاي يكون الاتصال أسرع.'}</p></section> : game.phase === 'setup' ? <section className="host-wait"><Smartphone/><h1>الجوال جاهز</h1><p>ابدأ اللعبة من الشاشة الكبيرة. لا تورّي الشاشة لباقي اللاعبين.</p></section> : game.phase === 'result' ? <section className="host-wait"><Trophy/><h1>انتهت اللعبة</h1><p>شوفوا النتيجة النهائية على الشاشة الكبيرة.</p></section> : <>
      <section className="host-round-head"><small>الكلمة {game.round+1} من {game.totalRounds}</small><h1>دور {activeTeam?.name}</h1><div className="host-team-turn" style={{'--team':activeTeam?.color} as CSSProperties}><Users/><span>أنت الموصّف الآن</span><strong>{game.seconds}ث</strong></div></section>
      <section className="host-secret-board"><div><span>سري · لا تورّي أحد</span><b>{game.card?.category}</b></div><article className="revealed" style={{gridTemplateColumns:'1fr'}}><b style={{fontSize:'clamp(30px,10vw,52px)',textAlign:'center'}}>{game.card?.word}</b></article></section>
      <section style={{padding:'0 18px 18px'}}><small style={{display:'block',marginBottom:10,color:'#b99a55'}}>ممنوع تقول:</small><div className="taboo-list">{game.card?.taboo.map(word=><b key={word}>{word}</b>)}</div></section>
      <div className="host-mobile-actions"><button className="primary" onClick={()=>send({type:'correct'})}><Check/> عرفوها · صح</button><button onClick={()=>send({type:'skip'})}><FastForward/> تخطّي</button></div>
    </>}
  </main>;
}
