import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import QRCode from 'qrcode';
import { ArrowLeft, Brain, Check, Copy, Flag, Lightbulb, RefreshCw, RotateCcw, Smartphone, Sparkles, Trophy, Users, Wifi, WifiOff, X } from 'lucide-react';
import { cardsForDifficulty, type WhoAmICard, type WhoAmIDifficulty } from '../../data/whoAmIQuestions';
import { drawWhoAmICards, loadWhoAmIPreferences, saveWhoAmIPreferences } from '../../utils/whoAmIStorage';
import Countdown from './Countdown';

type Phase = 'setup' | 'playing' | 'result';
type Team = { name: string; color: string; score: number; answers: number };
type RoomStatus = 'starting' | 'ready' | 'connecting' | 'connected' | 'disconnected' | 'error';
type HostCommand = { type: 'more-clue' } | { type: 'judge'; team: 0 | 1 | null };
type HostState = {
  type: 'who-private-state';
  phase: Phase;
  round: number;
  totalRounds: number;
  clueCount: number;
  points: number;
  teams: Team[];
  turn: 0 | 1;
  card: WhoAmICard | null;
};

const TEAM_COLORS = [
  { value: '#45b6ff', name: 'أزرق' },
  { value: '#ff70b5', name: 'وردي' },
  { value: '#a77bff', name: 'بنفسجي' },
  { value: '#ffd45a', name: 'ذهبي' },
];

function useWhoRoom(state: HostState, onCommand: (command: HostCommand) => void) {
  const [status, setStatus] = useState<RoomStatus>('starting');
  const [hostUrl, setHostUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const connectionRef = useRef<DataConnection | null>(null);
  const stateRef = useRef(state);
  const commandRef = useRef(onCommand);
  stateRef.current = state;
  commandRef.current = onCommand;

  useEffect(() => {
    const token = crypto.randomUUID().replace(/-/g, '');
    const peerId = `qaddha-who-${crypto.randomUUID()}`;
    const peer = new Peer(peerId);
    peer.on('open', () => {
      const url = new URL(window.location.href);
      url.search = '';
      url.hash = '';
      url.searchParams.set('host', 'who');
      url.searchParams.set('room', peerId);
      url.searchParams.set('token', token);
      const nextUrl = url.toString();
      setHostUrl(nextUrl);
      setStatus('ready');
      QRCode.toDataURL(nextUrl, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#080b1b', light: '#fff8df' } }).then(setQrCode).catch(() => setStatus('error'));
    });
    peer.on('connection', connection => {
      const metadata = connection.metadata as { token?: string; game?: string } | undefined;
      if (metadata?.token !== token || metadata?.game !== 'who') { connection.close(); return; }
      connectionRef.current?.close();
      connectionRef.current = connection;
      setStatus('connecting');
      connection.on('open', () => { setStatus('connected'); connection.send(stateRef.current); });
      connection.on('data', payload => {
        if (!payload || typeof payload !== 'object') return;
        const command = payload as Partial<HostCommand>;
        if (command.type === 'more-clue') commandRef.current({ type: 'more-clue' });
        if (command.type === 'judge' && (command.team === 0 || command.team === 1 || command.team === null)) commandRef.current({ type: 'judge', team: command.team });
      });
      connection.on('close', () => { if (connectionRef.current === connection) connectionRef.current = null; setStatus('disconnected'); });
      connection.on('error', () => setStatus('error'));
    });
    peer.on('error', () => setStatus('error'));
    return () => { connectionRef.current?.close(); peer.destroy(); };
  }, []);

  useEffect(() => { if (connectionRef.current?.open) connectionRef.current.send(state); }, [state]);
  return { status, hostUrl, qrCode };
}

function Pairing({ status, hostUrl, qrCode, compact = false }: { status: RoomStatus; hostUrl: string; qrCode: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const connected = status === 'connected';
  const copy = async () => { if (!hostUrl) return; try { await navigator.clipboard?.writeText(hostUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* QR remains available. */ } };
  if (compact) return <div className={`host-link-compact ${connected ? 'connected' : ''}`}>{connected ? <Wifi/> : <WifiOff/>}<div><b>{connected ? 'جوال المقدم متصل' : 'جوال المقدم غير متصل'}</b><small>{connected ? 'الإجابة وأزرار التحكيم على الجوال' : 'ارجع للإعدادات وامسح QR'}</small></div></div>;
  return <section className="host-pairing" aria-live="polite"><div className="host-pairing-copy"><span><Smartphone/> لوحة مقدم من أنا؟</span><h3>امسح الرمز بالجوال</h3><p>المقدم يشوف الإجابة سرّيًا ويتحكم بالتلميحات والتحكيم، بينما الشاشة الكبيرة تعرض للاعبين التلميحات فقط.</p><div className={`host-connection ${connected ? 'connected' : ''}`}>{connected ? <Wifi/> : <RefreshCw className={status === 'starting' || status === 'connecting' ? 'spin' : ''}/>}<b>{connected ? 'تم اتصال جوال المقدم' : status === 'error' ? 'تعذر إنشاء الغرفة' : status === 'disconnected' ? 'انقطع الاتصال · امسح الرمز مجددًا' : 'بانتظار اتصال الجوال'}</b></div><button className="quiet host-copy" disabled={!hostUrl} onClick={copy}>{copied ? <Check/> : <Copy/>}{copied ? 'تم نسخ الرابط' : 'نسخ رابط المقدم'}</button></div><div className="host-qr">{qrCode ? <img src={qrCode} alt="رمز QR لمقدم من أنا"/> : <div className="qr-loading"><RefreshCw className="spin"/><span>نجهز الغرفة…</span></div>}</div></section>;
}

export default function WhoAmIPrivate({ onHome }: { onHome: () => void }) {
  const [preferences] = useState(loadWhoAmIPreferences);
  const [teams, setTeams] = useState<Team[]>([
    { name: preferences.teamNames[0], color: preferences.teamColors[0], score: 0, answers: 0 },
    { name: preferences.teamNames[1], color: preferences.teamColors[1], score: 0, answers: 0 },
  ]);
  const [difficulty, setDifficulty] = useState<WhoAmIDifficulty>(preferences.difficulty);
  const [seconds, setSeconds] = useState(preferences.seconds);
  const [roundCount, setRoundCount] = useState(preferences.roundCount);
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [deck, setDeck] = useState<WhoAmICard[]>([]);
  const [clueCount, setClueCount] = useState(1);
  const [timedOut, setTimedOut] = useState(false);
  const currentCard = deck[round] ?? null;
  const turn = round % 2 as 0 | 1;
  const availablePoints = Math.max(100, (5 - clueCount) * 100);
  const validNames = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();
  const winner = useMemo(() => teams[0].score === teams[1].score ? null : teams[0].score > teams[1].score ? 0 : 1, [teams]);

  useEffect(() => {
    saveWhoAmIPreferences({ teamNames: [teams[0].name, teams[1].name], teamColors: [teams[0].color, teams[1].color], seconds, difficulty, roundCount });
  }, [difficulty, roundCount, seconds, teams]);

  const judge = (teamIndex: 0 | 1 | null) => {
    if (phase !== 'playing') return;
    if (teamIndex !== null && !timedOut) setTeams(current => current.map((team, index) => index === teamIndex ? { ...team, score: team.score + availablePoints, answers: team.answers + 1 } : team));
    if (round + 1 >= deck.length) { setPhase('result'); return; }
    setRound(value => value + 1);
    setClueCount(1);
    setTimedOut(false);
  };

  const state: HostState = { type: 'who-private-state', phase, round, totalRounds: deck.length, clueCount, points: timedOut ? 0 : availablePoints, teams, turn, card: phase === 'playing' ? currentCard : null };
  const room = useWhoRoom(state, command => {
    if (command.type === 'more-clue') { if (phase === 'playing' && currentCard) setClueCount(value => Math.min(currentCard.clues.length, value + 1)); return; }
    judge(command.team);
  });

  const startGame = () => {
    if (!validNames || room.status !== 'connected') return;
    const nextDeck = drawWhoAmICards(cardsForDifficulty(difficulty), roundCount, difficulty);
    if (!nextDeck.length) return;
    setTeams(current => current.map(team => ({ ...team, name: team.name.trim(), score: 0, answers: 0 })));
    setDeck(nextDeck); setRound(0); setClueCount(1); setTimedOut(false); setPhase('playing');
  };
  const restart = () => { const nextDeck = drawWhoAmICards(cardsForDifficulty(difficulty), roundCount, difficulty); if (!nextDeck.length) return; setDeck(nextDeck); setTeams(current => current.map(team => ({ ...team, score: 0, answers: 0 }))); setRound(0); setClueCount(1); setTimedOut(false); setPhase('playing'); };
  const updateTeam = (index: number, patch: Partial<Team>) => setTeams(current => current.map((team, teamIndex) => teamIndex === index ? { ...team, ...patch } : team));

  return <section className="arena who-arena" aria-label="لعبة من أنا">
    <div className="arena-heading"><div><span className="eyebrow"><Brain size={16}/> من أنا؟</span><h1>{phase === 'setup' ? 'الإجابة عند المقدم فقط.' : phase === 'result' ? 'انكشفت الشخصيات!' : `الشخصية ${round + 1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>
    {phase === 'setup' ? <div className="who-setup"><div className="section-heading"><h2>جهّزوا المواجهة والمقدم</h2><p>الشاشة الكبيرة تعرض التلميحات فقط. الإجابة والتحكيم تبقى على جوال المقدم.</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users size={36}/><span>0{index+1}</span></div><label>اسم الفريق {index===0?'الأول':'الثاني'}</label><input maxLength={22} value={team.name} onChange={event=>updateTeam(index,{name:event.target.value})}/><div className="color-choices">{TEAM_COLORS.map(color=><button key={color.value} aria-pressed={team.color===color.value} disabled={teams[1-index].color===color.value} style={{background:color.value}} onClick={()=>updateTeam(index,{color:color.value})}>{team.color===color.value?<Check size={17}/>:null}</button>)}</div></div>)}</div><div className="match-settings who-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة الشخصية<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>المستوى<select value={difficulty} onChange={event=>setDifficulty(event.target.value as WhoAmIDifficulty)}><option value="easy">خفيف</option><option value="medium">متوازن</option><option value="hard">للمحترفين</option></select></label><label>عدد الشخصيات<select value={roundCount} onChange={event=>setRoundCount(Number(event.target.value))}><option value={6}>6 شخصيات</option><option value={8}>8 شخصيات</option><option value={10}>10 شخصيات</option></select></label></div><Pairing {...room}/>{!validNames?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:room.status!=='connected'?<p className="validation">وصّل جوال المقدم أولًا.</p>:null}<div className="arena-actions"><span>المقدم يتحكم بالتلميحات والنتيجة من جواله.</span><button className="primary" disabled={!validNames||room.status!=='connected'} onClick={startGame}>ابدأوا التخمين</button></div></div> : null}
    {phase === 'playing' && currentCard ? <><Pairing {...room} compact/><div className="who-scorebar">{teams.map((team,index)=><div key={team.name} className={`who-team-score ${turn===index?'is-turn':''}`} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong><small>{team.answers} صحيحة</small></div>)}<div className="who-round"><small>الدور الأساسي</small><b>{teams[turn].name}</b><span>{currentCard.category}</span></div></div><div className="who-stage"><div className="mystery-avatar"><span>؟</span><Sparkles/></div><div className="who-value"><small>قيمة الإجابة الآن</small><strong>{timedOut?0:availablePoints}</strong><span>نقطة</span></div><div className="who-clues">{currentCard.clues.slice(0,clueCount).map((clue,index)=><div className="who-clue" key={clue}><span>{index+1}</span><p>{clue}</p></div>)}</div><Countdown key={currentCard.id} seconds={seconds} stopped={timedOut} onExpire={()=>setTimedOut(true)}/><div className="who-actions"><button className="secondary" disabled={timedOut||clueCount===currentCard.clues.length} onClick={()=>setClueCount(value=>Math.min(currentCard.clues.length,value+1))}><Lightbulb/> تلميح إضافي</button>{timedOut?<button className="primary" onClick={()=>judge(null)}>انتهى الوقت · الشخصية التالية</button>:<span className="validation" style={{margin:0}}>التحكيم والإجابة عند المقدم على الجوال</span>}</div></div></> : null}
    {phase === 'result' ? <div className="who-result"><Trophy size={70}/><span className="eyebrow">نهاية التحدّي</span><h2>{winner===null?'تعادل يستاهل جولة ثانية!':`${teams[winner].name}… عرفوها!`}</h2><div className="who-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><small>{team.name}</small><strong>{team.score}</strong><em>{team.answers} صحيحة</em></span>)}</div><div className="result-actions"><button className="primary" onClick={restart}><RotateCcw/> إعادة بنفس الإعدادات</button><button className="secondary" onClick={()=>setPhase('setup')}>تعديل الإعدادات</button></div></div> : null}
  </section>;
}

export function WhoAmIPhone({ roomId, token }: { roomId: string; token: string }) {
  const [status, setStatus] = useState<'connecting'|'connected'|'disconnected'|'error'>('connecting');
  const [game, setGame] = useState<HostState | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  useEffect(() => {
    if (!/^qaddha-who-[\w-]{20,}$/.test(roomId) || !/^[a-f\d]{32}$/i.test(token)) { setStatus('error'); return; }
    const peer = new Peer(); let stopped=false; let retryTimer=0;
    const connect=()=>{ if(stopped)return; setStatus('connecting'); const connection=peer.connect(roomId,{reliable:true,serialization:'json',metadata:{token,game:'who'}}); connectionRef.current=connection; connection.on('open',()=>setStatus('connected')); connection.on('data',payload=>{if(payload&&typeof payload==='object'&&(payload as HostState).type==='who-private-state')setGame(payload as HostState)}); connection.on('close',()=>{if(stopped)return;setStatus('disconnected');retryTimer=window.setTimeout(connect,2200)}); connection.on('error',()=>setStatus('disconnected')); };
    peer.on('open',connect); peer.on('error',()=>setStatus('error'));
    return()=>{stopped=true;window.clearTimeout(retryTimer);connectionRef.current?.close();peer.destroy();};
  },[roomId,token]);
  const send=(command:HostCommand)=>{if(connectionRef.current?.open)connectionRef.current.send(command)};
  return <main className="mobile-host" dir="rtl"><header><span className="host-brand"><Brain/> قدّها · من أنا؟</span><span className={`mobile-host-status ${status}`}>{status==='connected'?<Wifi/>:<WifiOff/>}{status==='connected'?'متصل بالشاشة':status==='error'?'الرابط غير صالح':'جاري الاتصال…'}</span></header>{!game?<section className="host-wait"><Smartphone/><h1>نربطك بشاشة اللعبة…</h1></section>:game.phase==='setup'?<section className="host-wait"><Check/><h1>تم الربط</h1><p>ابدأ اللعبة من الشاشة الكبيرة.</p></section>:game.phase==='result'?<section className="host-wait"><Trophy/><h1>انتهى التحدّي</h1></section>:<><section className="host-round-head"><small>الشخصية {game.round+1} من {game.totalRounds}</small><h1>{game.card?.answer}</h1><div className="host-team-turn" style={{'--team':game.teams[game.turn]?.color} as CSSProperties}><Users/><span>الدور الأساسي: <b>{game.teams[game.turn]?.name}</b></span><strong>{game.points}</strong></div></section><section className="host-secret-board"><div><span>التلميحات</span><b>{game.clueCount} / {game.card?.clues.length ?? 0}</b></div>{game.card?.clues.map((clue,index)=><article className={index<game.clueCount?'revealed':''} key={clue}><span>{index+1}</span><b>{clue}</b></article>)}</section><div className="host-mobile-actions"><button disabled={!game.card||game.clueCount>=game.card.clues.length} onClick={()=>send({type:'more-clue'})}><Lightbulb/> تلميح إضافي</button><button className="primary" onClick={()=>send({type:'judge',team:0})}><Check/> {game.teams[0]?.name}</button><button className="primary" onClick={()=>send({type:'judge',team:1})}><Check/> {game.teams[1]?.name}</button><button onClick={()=>send({type:'judge',team:null})}><X/> لا أحد</button></div></>}</main>;
}
