import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Copy, Eye, Gamepad2, RefreshCw, RotateCcw, Smartphone, Sparkles, Trophy, Users, Vote, Wifi, WifiOff, X } from 'lucide-react';
import Countdown from './Countdown';
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

type Phase = 'lobby' | 'talk' | 'vote' | 'result';
type Player = { id: string; name: string };
type SpySet = { place: string; words: string[] };
type PrivateRole = { spy: boolean; place?: string; clue?: string };
type ClientMessage = { type: 'join'; playerId: string; name: string } | { type: 'vote'; playerId: string; targetId: string };
type JoinNotice = { type: 'secret-join-notice'; accepted: boolean; displayName?: string; reason?: string };
type PhoneState = {
  type: 'secret-phone-state';
  phase: Phase;
  playerId: string;
  playerName: string;
  players: Player[];
  role: PrivateRole | null;
  votedFor: string | null;
  spyName?: string;
  place?: string;
};

type RoomStatus = 'starting' | 'ready' | 'connected' | 'error';

const PLAYER_ID_KEY = 'qaddha.secret.player-id.v1';
const spySets: SpySet[] = [
  { place: 'المطار', words: ['بوابة الصعود','جواز السفر','حقيبة السفر','برج المراقبة','بطاقة صعود','سوق حر'] },
  { place: 'المطعم', words: ['قائمة الطعام','النادل','الحساب','طاولة الحجز','المطبخ','المقبلات'] },
  { place: 'الملعب', words: ['الحكم','المدرج','صافرة','غرفة الملابس','لوحة النتيجة','خط التماس'] },
  { place: 'المدرسة', words: ['السبورة','الفسحة','الواجب','جرس الحصة','المقصف','دفتر الحضور'] },
  { place: 'المستشفى', words: ['موعد','سماعة الطبيب','صيدلية','غرفة انتظار','أشعة','ممرضة'] },
  { place: 'الشاطئ', words: ['مظلة','رمل','منشفة','قارب','موج','واقي شمس'] },
  { place: 'الفندق', words: ['الاستقبال','بطاقة الغرفة','مصعد','خدمة الغرف','حجز','حقيبة'] },
  { place: 'السوبرماركت', words: ['عربة تسوق','كاشير','فاتورة','رفوف','قسم الخضار','باركود'] },
];

function pick<T>(items: T[]) { return items[Math.floor(Math.random() * items.length)]; }
function normalizePlayerName(value: string) { return value.trim().replace(/\s+/g, ' ').slice(0, 18); }
function playerIdForDevice() {
  const fresh = () => `p-${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
  try {
    const stored = sessionStorage.getItem(PLAYER_ID_KEY);
    if (stored && /^p-[a-z0-9]{20}$/i.test(stored)) return stored;
    const id = fresh();
    sessionStorage.setItem(PLAYER_ID_KEY, id);
    return id;
  } catch { return fresh(); }
}
function uniquePlayerName(name: string, players: Player[], id: string) {
  const used = new Set(players.filter(player => player.id !== id).map(player => player.name.toLocaleLowerCase('ar')));
  if (!used.has(name.toLocaleLowerCase('ar'))) return name;
  for (let suffix = 2; suffix <= 20; suffix += 1) {
    const tail = ` ${suffix}`;
    const candidate = `${name.slice(0, Math.max(1, 18 - tail.length))}${tail}`;
    if (!used.has(candidate.toLocaleLowerCase('ar'))) return candidate;
  }
  return `${name.slice(0, 14)} ${Math.floor(Math.random() * 90 + 10)}`;
}

export default function SecretWordPrivate({ onHome }: { onHome: () => void }) {
  const [status, setStatus] = useState<RoomStatus>('starting');
  const [hostUrl, setHostUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>('lobby');
  const [roles, setRoles] = useState<Record<string, PrivateRole>>({});
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [roundSet, setRoundSet] = useState<SpySet>(spySets[0]);
  const [spyId, setSpyId] = useState('');
  const [copied, setCopied] = useState(false);
  const channelRef = useRef<ReturnType<typeof createRealtimeRoomChannel> | null>(null);
  const stateRef = useRef({ players, phase, roles, votes, roundSet, spyId });
  stateRef.current = { players, phase, roles, votes, roundSet, spyId };

  const syncOne = (id: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    const current = stateRef.current;
    const player = current.players.find(item => item.id === id);
    if (!player) return;
    const payload: PhoneState = {
      type: 'secret-phone-state', phase: current.phase, playerId: id, playerName: player.name,
      players: current.players, role: current.roles[id] || null, votedFor: current.votes[id] || null,
      ...(current.phase === 'result' ? { spyName: current.players.find(item => item.id === current.spyId)?.name || 'المتخفي', place: current.roundSet.place } : {}),
    };
    void channel.send({ type: 'broadcast', event: `state:${id}`, payload });
  };
  const syncAll = () => stateRef.current.players.forEach(player => syncOne(player.id));
  const sendJoinNotice = (id: string, notice: JoinNotice) => {
    void channelRef.current?.send({ type: 'broadcast', event: `join-notice:${id}`, payload: notice });
  };

  useEffect(() => {
    const roomId = createRealtimeRoomId('secret');
    const token = createRealtimeRoomToken();
    const next = buildRealtimeJoinUrl('secret', roomId, token);
    setHostUrl(next);
    void createRealtimeJoinQr(next).then(setQrCode).catch(() => setStatus('error'));
    const channel = createRealtimeRoomChannel('secret', roomId, token);
    channelRef.current = channel;
    channel
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return;
        const message = payload as Partial<ClientMessage>;
        if (message.type !== 'join' || typeof message.playerId !== 'string' || typeof message.name !== 'string') return;
        const id = message.playerId.slice(0, 50);
        const requestedName = normalizePlayerName(message.name);
        if (!id || !requestedName) return;
        const snapshot = stateRef.current;
        const existing = snapshot.players.find(item => item.id === id);
        if (!existing && snapshot.phase !== 'lobby') {
          sendJoinNotice(id, { type: 'secret-join-notice', accepted: false, reason: 'الجولة بدأت بالفعل. انتظر الجولة القادمة.' });
          return;
        }
        if (!existing && snapshot.players.length >= 10) {
          sendJoinNotice(id, { type: 'secret-join-notice', accepted: false, reason: 'الغرفة مكتملة: الحد الأقصى 10 لاعبين.' });
          return;
        }
        const displayName = uniquePlayerName(requestedName, snapshot.players, id);
        setStatus('connected');
        setPlayers(current => existing
          ? current.map(item => item.id === id ? { ...item, name: displayName } : item)
          : [...current, { id, name: displayName }]);
        sendJoinNotice(id, { type: 'secret-join-notice', accepted: true, displayName });
        window.setTimeout(() => syncOne(id), 100);
      })
      .on('broadcast', { event: 'vote' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return;
        const message = payload as Partial<ClientMessage>;
        if (message.type !== 'vote' || typeof message.playerId !== 'string' || typeof message.targetId !== 'string') return;
        const snapshot = stateRef.current;
        const voter = snapshot.players.find(player => player.id === message.playerId);
        const target = snapshot.players.find(player => player.id === message.targetId);
        if (snapshot.phase !== 'vote' || !voter || !target || voter.id === target.id) return;
        setVotes(current => current[voter.id] ? current : { ...current, [voter.id]: target.id });
      })
      .subscribe(nextStatus => {
        if (nextStatus === 'SUBSCRIBED') setStatus(current => current === 'connected' ? current : 'ready');
        else if (nextStatus === 'CHANNEL_ERROR') setStatus('error');
        else if (nextStatus === 'TIMED_OUT') setStatus('starting');
      });
    return () => { channelRef.current = null; void removeRealtimeChannel(channel); };
  }, []);

  useEffect(() => { syncAll(); }, [players, phase, roles, votes, roundSet, spyId]);
  const validVoteCount = useMemo(() => players.filter(player => {
    const targetId = votes[player.id];
    return Boolean(targetId && targetId !== player.id && players.some(target => target.id === targetId));
  }).length, [players, votes]);
  useEffect(() => { if (phase === 'vote' && players.length >= 3 && validVoteCount >= players.length) setPhase('result'); }, [phase, players.length, validVoteCount]);

  const start = () => {
    if (players.length < 3) return;
    const nextSet = pick(spySets);
    const nextSpy = pick(players).id;
    const shuffledWords = [...nextSet.words].sort(() => Math.random() - 0.5);
    const nextRoles: Record<string, PrivateRole> = {};
    let clueIndex = 0;
    players.forEach(player => {
      if (player.id === nextSpy) nextRoles[player.id] = { spy: true };
      else {
        nextRoles[player.id] = { spy: false, place: nextSet.place, clue: shuffledWords[clueIndex % shuffledWords.length] };
        clueIndex += 1;
      }
    });
    setRoundSet(nextSet); setSpyId(nextSpy); setRoles(nextRoles); setVotes({}); setPhase('talk');
  };
  const reset = () => { setRoles({}); setVotes({}); setSpyId(''); setPhase('lobby'); };
  const removePlayer = (id: string) => {
    if (phase !== 'lobby') return;
    setPlayers(current => current.filter(player => player.id !== id));
    setVotes(current => { const next = { ...current }; delete next[id]; return next; });
    setRoles(current => { const next = { ...current }; delete next[id]; return next; });
  };
  const voteCounts = useMemo(() => players.map(player => ({ ...player, count: Object.values(votes).filter(id => id === player.id).length })).sort((a,b) => b.count - a.count), [players, votes]);
  const topCount = voteCounts[0]?.count ?? 0;
  const leaders = voteCounts.filter(player => topCount > 0 && player.count === topCount);
  const tiedVote = leaders.length > 1;
  const accused = leaders[0];
  const caught = Boolean(accused && !tiedVote && accused.id === spyId);
  const copy = async () => { if (!hostUrl) return; try { await navigator.clipboard?.writeText(hostUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* QR is the fallback. */ } };

  return <section className="final-game secret-game" dir="rtl"><header className="final-head"><button className="quiet" onClick={onHome}>الألعاب</button><div><span><Sparkles/></span><small>سرّية متعددة الجوالات</small><h1>الكلمة السرّية</h1><p>كل لاعب يستلم دوره على جواله، ولا أحد يحتاج يمرر جهازه للثاني.</p></div></header>
    {phase === 'lobby' ? <article className="final-panel setup-panel"><h2>ادخلوا الغرفة من جوالاتكم</h2><p>امسحوا نفس QR من كل جوال، واكتبوا أسماءكم. يقبل قدّها من 3 إلى 10 لاعبين ويمنع تكرار الأسماء تلقائيًا.</p><section className="host-pairing"><div className="host-pairing-copy"><span><Smartphone/> غرفة اللاعبين</span><h3>{players.length} / 10 لاعبين</h3><div className={`host-connection ${players.length >= 3 ? 'connected' : ''}`}>{players.length >= 3 ? <Wifi/> : <RefreshCw className={status === 'starting' || status === 'ready' ? 'spin' : ''}/>}<b>{status === 'error' ? 'تعذر الاتصال بالخادم' : players.length >= 3 ? 'جاهزين للبدء' : 'بانتظار 3 لاعبين على الأقل'}</b></div><button className="quiet host-copy" disabled={!hostUrl} onClick={copy}>{copied ? <Check/> : <Copy/>}{copied ? 'تم نسخ الرابط' : 'نسخ رابط اللاعبين'}</button></div><div className="host-qr">{qrCode ? <img src={qrCode} alt="QR دخول لعبة الكلمة السرية"/> : <div className="qr-loading"><RefreshCw className="spin"/><span>نجهز الغرفة…</span></div>}</div></section><div className="player-names" style={{ marginTop: 18 }}>{players.map(player => <div key={player.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',border:'1px solid #ffffff18',borderRadius:14}}><Check size={17}/><b>{player.name}</b><small style={{marginInlineStart:'auto'}}>متصل</small><button className="quiet" aria-label={`إزالة ${player.name}`} onClick={()=>removePlayer(player.id)}><X size={15}/></button></div>)}</div><button className="primary" disabled={players.length < 3} onClick={start}>وزّع الأدوار وابدأ <Users/></button></article>
    : phase === 'talk' ? <article className="final-panel play-panel"><Users className="feature-icon"/><span className="turn-chip">{players.length} لاعبين</span><h2>الأدوار وصلت للجوالات</h2><p>ابدأوا الأسئلة. لا تذكروا المكان أو الكلمة مباشرة، والمتخفي يحاول يندمج.</p><Countdown seconds={120} stopped={false} onExpire={() => setPhase('vote')}/><button className="primary" onClick={() => setPhase('vote')}><Vote/> الانتقال للتصويت</button></article>
    : phase === 'vote' ? <article className="final-panel play-panel"><Vote className="feature-icon"/><h2>التصويت من الجوالات</h2><p>كل لاعب يختار شخصًا واحدًا من جواله. التصويت سري حتى يكتمل، ولا يمكن التصويت للنفس.</p><strong style={{fontSize:'2rem'}}>{validVoteCount} / {players.length}</strong><div style={{display:'grid',gap:8,marginTop:18}}>{players.map(player => <div key={player.id} style={{display:'flex',justifyContent:'space-between',padding:'12px 14px',border:'1px solid #ffffff18',borderRadius:14}}><b>{player.name}</b><span>{votes[player.id] ? '✓ صوّت' : 'بانتظار التصويت'}</span></div>)}</div><button className="quiet" disabled={!validVoteCount} onClick={() => setPhase('result')}>إنهاء التصويت الآن</button></article>
    : <article className="final-panel final-result"><Trophy/><small>كشف الأدوار</small><h2>{tiedVote ? 'تعادل التصويت… المتخفي نجا!' : caught ? 'انكشف المتخفي!' : 'المتخفي نجا!'}</h2><p>المتخفي كان <b>{players.find(player => player.id === spyId)?.name}</b> · المكان: <b>{roundSet.place}</b></p>{leaders.length ? <p>{tiedVote ? <>تعادل أعلى تصويت بين <b>{leaders.map(player => player.name).join(' و ')}</b> ({topCount} لكل لاعب)</> : <>أعلى تصويت: <b>{accused?.name}</b> ({topCount})</>}</p> : <p>انتهت الجولة بدون أصوات مسجلة.</p>}<div style={{display:'grid',gap:8,width:'min(560px,100%)',margin:'16px auto'}}>{voteCounts.map(player => <div key={player.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',border:'1px solid #ffffff18',borderRadius:12}}><span>{player.name}</span><b>{player.count} صوت</b></div>)}</div><button className="primary" onClick={start}><RotateCcw/> جولة جديدة بنفس اللاعبين</button><button className="quiet" onClick={reset}>تغيير اللاعبين</button></article>}
  </section>;
}

export function SecretWordPhone({ roomId, token }: { roomId: string; token: string }) {
  const [status, setStatus] = useState<'connecting'|'connected'|'error'>('connecting');
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [joinPending, setJoinPending] = useState(false);
  const [joinNotice, setJoinNotice] = useState('');
  const [game, setGame] = useState<PhoneState | null>(null);
  const playerIdRef = useRef(playerIdForDevice());
  const channelRef = useRef<ReturnType<typeof createRealtimeRoomChannel> | null>(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  const sendJoin = () => {
    const channel = channelRef.current;
    const clean = normalizePlayerName(nameRef.current);
    if (!channel || !clean || status !== 'connected') return;
    void channel.send({ type:'broadcast', event:'join', payload:{ type:'join', playerId:playerIdRef.current, name:clean } satisfies ClientMessage });
  };

  useEffect(() => {
    if (!isValidRealtimeRoomId(roomId, 'secret') || !isValidRealtimeRoomToken(token)) { setStatus('error'); return; }
    const channel = createRealtimeRoomChannel('secret', roomId, token);
    channelRef.current = channel;
    channel
      .on('broadcast', { event: `state:${playerIdRef.current}` }, ({ payload }) => {
        if (payload && typeof payload === 'object' && (payload as PhoneState).type === 'secret-phone-state') {
          const next = payload as PhoneState;
          setGame(next); setName(next.playerName); setJoined(true); setJoinPending(false); setJoinNotice(''); setStatus('connected');
        }
      })
      .on('broadcast', { event: `join-notice:${playerIdRef.current}` }, ({ payload }) => {
        if (!payload || typeof payload !== 'object' || (payload as JoinNotice).type !== 'secret-join-notice') return;
        const notice = payload as JoinNotice;
        if (notice.accepted) {
          if (notice.displayName) setName(notice.displayName);
          setJoinNotice('تم قبولك، نجهّز دورك…');
        } else {
          setJoinPending(false);
          setJoined(false);
          setJoinNotice(notice.reason || 'تعذر دخول الغرفة.');
        }
      })
      .subscribe(nextStatus => {
        if (nextStatus === 'SUBSCRIBED') setStatus('connected');
        else if (nextStatus === 'CHANNEL_ERROR') setStatus('error');
        else if (nextStatus === 'TIMED_OUT') setStatus('connecting');
      });
    return () => { channelRef.current = null; void removeRealtimeChannel(channel); };
  }, [roomId, token]);

  useEffect(() => {
    if (!joinPending || joined || game || status !== 'connected') return;
    sendJoin();
    const timer = window.setInterval(sendJoin, 1200);
    return () => window.clearInterval(timer);
  }, [game, joinPending, joined, status]);

  const join = (event: FormEvent) => {
    event.preventDefault();
    const clean = normalizePlayerName(name);
    if (!clean || status !== 'connected') return;
    setName(clean); setJoinNotice('جاري تسجيل دخولك…'); setJoinPending(true); sendJoin();
  };
  const vote = (targetId: string) => {
    const channel = channelRef.current;
    if (!channel || status !== 'connected' || game?.votedFor || !game || targetId === game.playerId || !game.players.some(player => player.id === targetId)) return;
    void channel.send({ type:'broadcast', event:'vote', payload:{ type:'vote', playerId:playerIdRef.current, targetId } satisfies ClientMessage });
  };

  return <main className="mobile-host" dir="rtl"><header><span className="host-brand"><Gamepad2/> قدّها</span><span className={`mobile-host-status ${status}`}>{status === 'connected' ? <Wifi/> : <WifiOff/>}{status === 'connected' ? 'متصل بالغرفة' : status === 'error' ? 'تعذر الاتصال' : 'جاري الاتصال…'}</span></header>
    {!joined ? <form className="host-wait" onSubmit={join}><Smartphone/><h1>ادخل اسمك</h1><p>دورك سيظهر على هذا الجوال فقط.</p><input autoFocus maxLength={18} value={name} disabled={joinPending} onChange={event => setName(event.target.value)} placeholder="اسم اللاعب" style={{width:'100%',padding:14,borderRadius:14}}/>{joinNotice ? <p>{joinNotice}</p> : null}<button className="primary" disabled={!name.trim() || status !== 'connected' || joinPending}>{joinPending ? 'جاري الدخول…' : 'دخول الغرفة'}</button>{status === 'error' ? <button type="button" className="quiet" onClick={() => window.location.reload()}><RefreshCw/> إعادة المحاولة</button> : null}</form>
    : !game ? <section className="host-wait"><RefreshCw className="spin"/><h1>بانتظار شاشة اللعب…</h1></section>
    : game.phase === 'lobby' ? <section className="host-wait"><Check/><h1>أنت داخل الغرفة يا {game.playerName}</h1><p>انتظر حتى يبدأ المضيف الجولة.</p></section>
    : game.phase === 'talk' ? <section className="host-wait"><Eye/><small>دورك السري</small><h1>{game.role?.spy ? 'أنت المتخفي' : game.role?.place}</h1><p>{game.role?.spy ? 'ما تعرف المكان. اسأل بذكاء، حاول تندمج، واستنتج المكان قبل ما يشكون فيك.' : <>تلميحك الخاص: <b>{game.role?.clue}</b><br/>لا تقل المكان أو التلميح مباشرة.</>}</p></section>
    : game.phase === 'vote' ? <section className="host-wait"><Vote/><h1>{game.votedFor ? 'تم تسجيل صوتك' : 'مين المتخفي؟'}</h1>{game.votedFor ? <p>انتظر باقي اللاعبين. ما تقدر تغيّر صوتك بعد الإرسال.</p> : <div style={{display:'grid',gap:10,width:'100%'}}>{game.players.filter(player => player.id !== game.playerId).map(player => <button className="secondary" key={player.id} onClick={() => vote(player.id)}>{player.name}</button>)}</div>}</section>
    : <section className="host-wait"><Trophy/><small>انتهت الجولة</small><h1>المتخفي: {game.spyName}</h1><p>المكان كان: <b>{game.place}</b></p></section>}
  </main>;
}
