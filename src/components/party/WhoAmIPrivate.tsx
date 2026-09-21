import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, Brain, Check, Copy, Eye, Flag, Lightbulb, RefreshCw, RotateCcw, Smartphone, Sparkles, Trophy, Users, Wifi, WifiOff, X } from 'lucide-react';
import { cardsForDifficulty, type WhoAmICard, type WhoAmIDifficulty } from '../../data/whoAmIQuestions';
import { drawWhoAmICards, loadWhoAmIPreferences, saveWhoAmIPreferences } from '../../utils/whoAmIStorage';
import {
  buildRealtimeJoinUrl,
  createRealtimeJoinQr,
  createRealtimeRoomChannel,
  createRealtimeRoomId,
  createRealtimeRoomToken,
  isValidRealtimeRoomId,
  isValidRealtimeRoomToken,
  removeRealtimeChannel,
} from '../../utils/qaddhaRealtime';
import Countdown from './Countdown';
import WhoAnswerReveal from './WhoAnswerReveal';

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

type AnswerReveal = { card: WhoAmICard; teamName: string };

const TEAM_COLORS = [
  { value: '#45b6ff', name: 'أزرق' },
  { value: '#ff70b5', name: 'وردي' },
  { value: '#a77bff', name: 'بنفسجي' },
  { value: '#ffd45a', name: 'ذهبي' },
];
const ONLINE_PARAMS = new URLSearchParams(window.location.search);
const ONLINE_EMBED = ONLINE_PARAMS.get('onlineEmbed') === '1';
const ONLINE_TEAM_NAMES: [string,string] = [
  ONLINE_PARAMS.get('onlineTeam0')?.trim() || 'الفريق الأول',
  ONLINE_PARAMS.get('onlineTeam1')?.trim() || 'الفريق الثاني',
];
const ONLINE_TIMER = Number(ONLINE_PARAMS.get('onlineTimer') || '45');
const ONLINE_ROUNDS = Number(ONLINE_PARAMS.get('onlineRounds') || '8');
const ONLINE_DIFFICULTY = ONLINE_PARAMS.get('onlineDifficulty') as WhoAmIDifficulty | null;

function useWhoRoom(state: HostState, onCommand: (command: HostCommand) => void, enabled = true) {
  const [status, setStatus] = useState<RoomStatus>(enabled ? 'starting' : 'connected');
  const [hostUrl, setHostUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const channelRef = useRef<ReturnType<typeof createRealtimeRoomChannel> | null>(null);
  const stateRef = useRef(state);
  const commandRef = useRef(onCommand);
  stateRef.current = state;
  commandRef.current = onCommand;

  useEffect(() => {
    if (!enabled) { setStatus('connected'); return; }
    const roomId = createRealtimeRoomId('who');
    const token = createRealtimeRoomToken();
    const nextUrl = buildRealtimeJoinUrl('who', roomId, token);
    setHostUrl(nextUrl);
    void createRealtimeJoinQr(nextUrl).then(setQrCode).catch(() => setStatus('error'));
    const channel = createRealtimeRoomChannel('who', roomId, token);
    channelRef.current = channel;
    channel
      .on('broadcast', { event: 'hello' }, () => {
        setStatus('connected');
        void channel.send({ type: 'broadcast', event: 'state', payload: stateRef.current });
      })
      .on('broadcast', { event: 'command' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return;
        const command = payload as Partial<HostCommand>;
        if (command.type === 'more-clue') commandRef.current({ type: 'more-clue' });
        if (command.type === 'judge' && (command.team === 0 || command.team === 1 || command.team === null)) commandRef.current({ type: 'judge', team: command.team });
      })
      .subscribe(nextStatus => {
        if (nextStatus === 'SUBSCRIBED') setStatus(current => current === 'connected' ? current : 'ready');
        else if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') setStatus('error');
        else if (nextStatus === 'CLOSED') setStatus('disconnected');
      });
    return () => { channelRef.current = null; void removeRealtimeChannel(channel); };
  }, [enabled]);

  useEffect(() => {
    const channel = channelRef.current;
    if (channel && status === 'connected') void channel.send({ type: 'broadcast', event: 'state', payload: state });
  }, [state, status]);
  return { status, hostUrl, qrCode };
}

function Pairing({ status, hostUrl, qrCode, compact = false }: { status: RoomStatus; hostUrl: string; qrCode: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const connected = status === 'connected';
  const copy = async () => { if (!hostUrl) return; try { await navigator.clipboard?.writeText(hostUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* QR remains available. */ } };
  if (compact) return <div className={`host-link-compact ${connected ? 'connected' : ''}`}>{connected ? <Wifi/> : <WifiOff/>}<div><b>{connected ? 'جوال المقدم متصل' : 'جوال المقدم غير متصل'}</b><small>{connected ? 'الإجابة وأزرار التحكيم على الجوال' : 'ارجع للإعدادات وامسح QR'}</small></div></div>;
  return <section className="host-pairing" aria-live="polite"><div className="host-pairing-copy"><span><Smartphone/> لوحة مقدم من أنا؟</span><h3>امسح الرمز بالجوال</h3><p>المقدم يشوف الإجابة سرّيًا ويتحكم بالتلميحات والتحكيم. الاتصال يمر عبر خادم قدّها، حتى لو الجوال على شبكة مختلفة.</p><div className={`host-connection ${connected ? 'connected' : ''}`}>{connected ? <Wifi/> : <RefreshCw className={status === 'starting' || status === 'connecting' || status === 'ready' ? 'spin' : ''}/>}<b>{connected ? 'تم اتصال جوال المقدم' : status === 'error' ? 'تعذر الاتصال بالخادم' : status === 'disconnected' ? 'انقطع الاتصال · افتح الرمز مجددًا' : 'بانتظار اتصال الجوال'}</b></div><button className="quiet host-copy" disabled={!hostUrl} onClick={copy}>{copied ? <Check/> : <Copy/>}{copied ? 'تم نسخ الرابط' : 'نسخ رابط المقدم'}</button></div><div className="host-qr">{qrCode ? <img src={qrCode} alt="رمز QR لمقدم من أنا"/> : <div className="qr-loading"><RefreshCw className="spin"/><span>نجهز الغرفة…</span></div>}</div></section>;
}

export default function WhoAmIPrivate({ onHome }: { onHome: () => void }) {
  const [preferences] = useState(loadWhoAmIPreferences);
  const [teams, setTeams] = useState<Team[]>([
    { name: ONLINE_EMBED ? ONLINE_TEAM_NAMES[0] : preferences.teamNames[0], color: preferences.teamColors[0], score: 0, answers: 0 },
    { name: ONLINE_EMBED ? ONLINE_TEAM_NAMES[1] : preferences.teamNames[1], color: preferences.teamColors[1], score: 0, answers: 0 },
  ]);
  const [difficulty, setDifficulty] = useState<WhoAmIDifficulty>(ONLINE_EMBED && ['easy','medium','hard','mixed'].includes(ONLINE_DIFFICULTY || '') ? ONLINE_DIFFICULTY as WhoAmIDifficulty : preferences.difficulty);
  const [seconds, setSeconds] = useState(ONLINE_EMBED && [30,45,60].includes(ONLINE_TIMER) ? ONLINE_TIMER : preferences.seconds);
  const [roundCount, setRoundCount] = useState(ONLINE_EMBED && [6,8,10].includes(ONLINE_ROUNDS) ? ONLINE_ROUNDS : preferences.roundCount);
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [deck, setDeck] = useState<WhoAmICard[]>([]);
  const [clueCount, setClueCount] = useState(1);
  const [timedOut, setTimedOut] = useState(false);
  const [answerReveal, setAnswerReveal] = useState<AnswerReveal | null>(null);
  const [onlineAnswerVisible, setOnlineAnswerVisible] = useState(false);
  const currentCard = deck[round] ?? null;
  const turn = round % 2 as 0 | 1;
  const availablePoints = Math.max(100, (5 - clueCount) * 100);
  const validNames = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();
  const winner = useMemo(() => teams[0].score === teams[1].score ? null : teams[0].score > teams[1].score ? 0 : 1, [teams]);

  useEffect(() => {
    if (ONLINE_EMBED) return;
    saveWhoAmIPreferences({ teamNames: [teams[0].name, teams[1].name], teamColors: [teams[0].color, teams[1].color], seconds, difficulty, roundCount });
  }, [difficulty, roundCount, seconds, teams]);

  useEffect(() => {
    if (!answerReveal) return;
    const timer = window.setTimeout(() => setAnswerReveal(null), 4500);
    return () => window.clearTimeout(timer);
  }, [answerReveal]);

  const judge = (teamIndex: 0 | 1 | null) => {
    if (phase !== 'playing') return;
    if (teamIndex !== null && !timedOut) {
      if (currentCard) setAnswerReveal({ card: currentCard, teamName: teams[teamIndex].name });
      setTeams(current => current.map((team, index) => index === teamIndex ? { ...team, score: team.score + availablePoints, answers: team.answers + 1 } : team));
    }
    if (round + 1 >= deck.length) { setPhase('result'); return; }
    setRound(value => value + 1);
    setClueCount(1);
    setTimedOut(false);
    setOnlineAnswerVisible(false);
  };

  const state: HostState = { type: 'who-private-state', phase, round, totalRounds: deck.length, clueCount, points: timedOut ? 0 : availablePoints, teams, turn, card: phase === 'playing' ? currentCard : null };
  const room = useWhoRoom(state, command => {
    if (command.type === 'more-clue') { if (phase === 'playing' && currentCard) setClueCount(value => Math.min(currentCard.clues.length, value + 1)); return; }
    judge(command.team);
  }, !ONLINE_EMBED);

  const startGame = () => {
    if (!validNames || (!ONLINE_EMBED && room.status !== 'connected')) return;
    const nextDeck = drawWhoAmICards(cardsForDifficulty(difficulty), roundCount, difficulty);
    if (!nextDeck.length) return;
    setTeams(current => current.map(team => ({ ...team, name: team.name.trim(), score: 0, answers: 0 })));
    setAnswerReveal(null);
    setOnlineAnswerVisible(false);
    setDeck(nextDeck); setRound(0); setClueCount(1); setTimedOut(false); setPhase('playing');
  };
  const restart = () => { const nextDeck = drawWhoAmICards(cardsForDifficulty(difficulty), roundCount, difficulty); if (!nextDeck.length) return; setAnswerReveal(null); setOnlineAnswerVisible(false); setDeck(nextDeck); setTeams(current => current.map(team => ({ ...team, score: 0, answers: 0 }))); setRound(0); setClueCount(1); setTimedOut(false); setPhase('playing'); };
  useEffect(() => { if (ONLINE_EMBED && phase === 'setup' && validNames) startGame(); }, [phase, validNames]);
  const updateTeam = (index: number, patch: Partial<Team>) => setTeams(current => current.map((team, teamIndex) => teamIndex === index ? { ...team, ...patch } : team));

  return <section className="arena who-arena" aria-label="لعبة من أنا">
    <div className="arena-heading"><div><span className="eyebrow"><Brain size={16}/> من أنا؟</span><h1>{phase === 'setup' ? 'الإجابة عند المقدم فقط.' : phase === 'result' ? 'انكشفت الشخصيات!' : `الشخصية ${round + 1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>
    {phase === 'setup' ? <div className="who-setup"><div className="section-heading"><h2>جهّزوا المواجهة والمقدم</h2><p>الشاشة الكبيرة تعرض التلميحات فقط. الإجابة والتحكيم تبقى على جوال المقدم.</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users size={36}/><span>0{index+1}</span></div><label>اسم الفريق {index===0?'الأول':'الثاني'}</label><input maxLength={22} value={team.name} onChange={event=>updateTeam(index,{name:event.target.value})}/><div className="color-choices">{TEAM_COLORS.map(color=><button key={color.value} aria-pressed={team.color===color.value} disabled={teams[1-index].color===color.value} style={{background:color.value}} onClick={()=>updateTeam(index,{color:color.value})}>{team.color===color.value?<Check size={17}/>:null}</button>)}</div></div>)}</div><div className="match-settings who-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة الشخصية<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>المستوى<select value={difficulty} onChange={event=>setDifficulty(event.target.value as WhoAmIDifficulty)}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option><option value="mixed">عشوائي</option></select></label><label>عدد الشخصيات<select value={roundCount} onChange={event=>setRoundCount(Number(event.target.value))}><option value={6}>6 شخصيات</option><option value={8}>8 شخصيات</option><option value={10}>10 شخصيات</option></select></label></div>{!ONLINE_EMBED && <Pairing {...room}/>}{!validNames?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:!ONLINE_EMBED&&room.status!=='connected'?<p className="validation">وصّل جوال المقدم أولًا.</p>:null}<div className="arena-actions"><span>المقدم يتحكم بالتلميحات والنتيجة من جواله.</span><button className="primary" disabled={!validNames||(!ONLINE_EMBED&&room.status!=='connected')} onClick={startGame}>ابدأوا التخمين</button></div></div> : null}
    {phase === 'playing' && currentCard ? <>{!ONLINE_EMBED && <Pairing {...room} compact/>}<div className="who-scorebar">{teams.map((team,index)=><div key={team.name} className={`who-team-score ${turn===index?'is-turn':''}`} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong><small>{team.answers} صحيحة</small></div>)}<div className="who-round"><small>الدور الأساسي</small><b>{teams[turn].name}</b><span>{currentCard.category}</span></div></div><div className="who-stage"><div className="mystery-avatar"><span>؟</span><Sparkles/></div><div className="who-value"><small>قيمة الإجابة الآن</small><strong>{timedOut?0:availablePoints}</strong><span>نقطة</span></div><div className="who-clues">{currentCard.clues.slice(0,clueCount).map((clue,index)=><div className="who-clue" key={clue}><span>{index+1}</span><p>{clue}</p></div>)}</div><Countdown key={currentCard.id} seconds={seconds} stopped={timedOut} onExpire={()=>setTimedOut(true)}/><div className="who-actions"><button className="secondary" disabled={timedOut||clueCount===currentCard.clues.length} onClick={()=>setClueCount(value=>Math.min(currentCard.clues.length,value+1))}><Lightbulb/> تلميح إضافي</button>{ONLINE_EMBED?<div className="judge-row">{!onlineAnswerVisible&&!timedOut?<button className="primary" onClick={()=>setOnlineAnswerVisible(true)}><Eye/> كشف الإجابة</button>:<><p className="revealed-answer"><b>{currentCard.answer}</b></p>{teams.map((team,index)=><button key={team.name} onClick={()=>judge(index as 0|1)}><Check/> {team.name}</button>)}<button onClick={()=>judge(null)}><X/> لا أحد</button></>}</div>:timedOut?<button className="primary" onClick={()=>judge(null)}>انتهى الوقت · الشخصية التالية</button>:<span className="validation" style={{margin:0}}>التحكيم والإجابة عند المقدم على الجوال</span>}</div></div></> : null}
    {phase === 'result' ? <div className="who-result"><Trophy size={70}/><span className="eyebrow">نهاية التحدّي</span><h2>{winner===null?'تعادل يستاهل جولة ثانية!':`${teams[winner].name}… عرفوها!`}</h2><div className="who-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><small>{team.name}</small><strong>{team.score}</strong><em>{team.answers} صحيحة</em></span>)}</div><div className="result-actions"><button className="primary" onClick={restart}><RotateCcw/> إعادة بنفس الإعدادات</button><button className="secondary" onClick={()=>{setAnswerReveal(null);setPhase('setup');}}>تعديل الإعدادات</button></div></div> : null}
    {answerReveal ? <WhoAnswerReveal card={answerReveal.card} teamName={answerReveal.teamName} onClose={()=>setAnswerReveal(null)}/> : null}
  </section>;
}

export function WhoAmIPhone({ roomId, token }: { roomId: string; token: string }) {
  const [status, setStatus] = useState<'connecting'|'connected'|'disconnected'|'error'>('connecting');
  const [game, setGame] = useState<HostState | null>(null);
  const channelRef = useRef<ReturnType<typeof createRealtimeRoomChannel> | null>(null);
  useEffect(() => {
    if (!isValidRealtimeRoomId(roomId, 'who') || !isValidRealtimeRoomToken(token)) { setStatus('error'); return; }
    const channel = createRealtimeRoomChannel('who', roomId, token);
    channelRef.current = channel;
    channel.on('broadcast', { event: 'state' }, ({ payload }) => {
      if (payload && typeof payload === 'object' && (payload as HostState).type === 'who-private-state') { setGame(payload as HostState); setStatus('connected'); }
    }).subscribe(nextStatus => {
      if (nextStatus === 'SUBSCRIBED') { setStatus('connected'); void channel.send({ type: 'broadcast', event: 'hello', payload: { at: Date.now() } }); }
      else if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') setStatus('error');
      else if (nextStatus === 'CLOSED') setStatus('disconnected');
    });
    return () => { channelRef.current = null; void removeRealtimeChannel(channel); };
  },[roomId,token]);
  const send=(command:HostCommand)=>{const channel=channelRef.current;if(channel&&status==='connected')void channel.send({type:'broadcast',event:'command',payload:command})};
  return <main className="mobile-host" dir="rtl"><header><span className="host-brand"><Brain/> قدّها · من أنا؟</span><span className={`mobile-host-status ${status}`}>{status==='connected'?<Wifi/>:<WifiOff/>}{status==='connected'?'متصل بالشاشة':status==='error'?'تعذر الاتصال':'جاري الاتصال…'}</span></header>{!game?<section className="host-wait"><Smartphone/><h1>نربطك بشاشة اللعبة…</h1></section>:game.phase==='setup'?<section className="host-wait"><Check/><h1>تم الربط</h1><p>ابدأ اللعبة من الشاشة الكبيرة.</p></section>:game.phase==='result'?<section className="host-wait"><Trophy/><h1>انتهى التحدّي</h1></section>:<><section className="host-round-head"><small>الشخصية {game.round+1} من {game.totalRounds}</small><h1>{game.card?.answer}</h1><div className="host-team-turn" style={{'--team':game.teams[game.turn]?.color} as CSSProperties}><Users/><span>الدور الأساسي: <b>{game.teams[game.turn]?.name}</b></span><strong>{game.points}</strong></div></section><section className="host-secret-board"><div><span>التلميحات</span><b>{game.clueCount} / {game.card?.clues.length ?? 0}</b></div>{game.card?.clues.map((clue,index)=><article className={index<game.clueCount?'revealed':''} key={clue}><span>{index+1}</span><b>{clue}</b></article>)}</section><div className="host-mobile-actions"><button disabled={!game.card||game.clueCount>=game.card.clues.length} onClick={()=>send({type:'more-clue'})}><Lightbulb/> تلميح إضافي</button><button className="primary" onClick={()=>send({type:'judge',team:0})}><Check/> {game.teams[0]?.name}</button><button className="primary" onClick={()=>send({type:'judge',team:1})}><Check/> {game.teams[1]?.name}</button><button onClick={()=>send({type:'judge',team:null})}><X/> لا أحد</button></div></>}</main>;
}
