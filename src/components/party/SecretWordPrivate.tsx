import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import QRCode from 'qrcode';
import { Check, Copy, Eye, Gamepad2, RefreshCw, RotateCcw, Smartphone, Sparkles, Trophy, Users, Vote, Wifi, WifiOff } from 'lucide-react';
import Countdown from './Countdown';

type Phase = 'lobby' | 'talk' | 'vote' | 'result';
type Player = { id: string; name: string };
type SpySet = { place: string; words: string[] };
type PrivateRole = { spy: boolean; place?: string; clue?: string };
type ClientMessage = { type: 'join'; name: string } | { type: 'vote'; targetId: string };
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
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const stateRef = useRef({ players, phase, roles, votes, roundSet, spyId });
  stateRef.current = { players, phase, roles, votes, roundSet, spyId };

  const syncOne = (id: string) => {
    const connection = connectionsRef.current.get(id);
    if (!connection?.open) return;
    const current = stateRef.current;
    const player = current.players.find(item => item.id === id);
    if (!player) return;
    const payload: PhoneState = {
      type: 'secret-phone-state',
      phase: current.phase,
      playerId: id,
      playerName: player.name,
      players: current.players,
      role: current.roles[id] || null,
      votedFor: current.votes[id] || null,
      ...(current.phase === 'result' ? {
        spyName: current.players.find(item => item.id === current.spyId)?.name || 'المتخفي',
        place: current.roundSet.place,
      } : {}),
    };
    connection.send(payload);
  };
  const syncAll = () => connectionsRef.current.forEach((_, id) => syncOne(id));

  useEffect(() => {
    const token = crypto.randomUUID().replace(/-/g, '');
    const peerId = `qaddha-secret-${crypto.randomUUID()}`;
    const peer = new Peer(peerId);
    peer.on('open', () => {
      const url = new URL(window.location.href);
      url.search = ''; url.hash = '';
      url.searchParams.set('host', 'secret');
      url.searchParams.set('room', peerId);
      url.searchParams.set('token', token);
      const next = url.toString();
      setHostUrl(next);
      setStatus('ready');
      QRCode.toDataURL(next, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#080b1b', light: '#fff8df' } }).then(setQrCode).catch(() => setStatus('error'));
    });
    peer.on('connection', connection => {
      const metadata = connection.metadata as { token?: string; game?: string } | undefined;
      if (metadata?.token !== token || metadata?.game !== 'secret') { connection.close(); return; }
      connectionsRef.current.set(connection.peer, connection);
      connection.on('open', () => { setStatus('connected'); });
      connection.on('data', raw => {
        if (!raw || typeof raw !== 'object') return;
        const message = raw as Partial<ClientMessage>;
        if (message.type === 'join' && typeof message.name === 'string') {
          const name = message.name.trim().slice(0, 18);
          if (!name) return;
          setPlayers(current => {
            const exists = current.some(item => item.id === connection.peer);
            const next = exists ? current.map(item => item.id === connection.peer ? { ...item, name } : item) : [...current, { id: connection.peer, name }].slice(0, 10);
            return next;
          });
          window.setTimeout(() => syncOne(connection.peer), 50);
        } else if (message.type === 'vote' && typeof message.targetId === 'string') {
          setVotes(current => current[connection.peer] ? current : { ...current, [connection.peer]: message.targetId! });
        }
      });
      connection.on('close', () => {
        connectionsRef.current.delete(connection.peer);
        if (stateRef.current.phase === 'lobby') setPlayers(current => current.filter(item => item.id !== connection.peer));
      });
      connection.on('error', () => connectionsRef.current.delete(connection.peer));
    });
    peer.on('error', () => setStatus('error'));
    return () => { connectionsRef.current.forEach(connection => connection.close()); peer.destroy(); };
  }, []);

  useEffect(() => { syncAll(); }, [players, phase, roles, votes, roundSet, spyId]);
  useEffect(() => {
    if (phase === 'vote' && players.length >= 3 && Object.keys(votes).length >= players.length) setPhase('result');
  }, [phase, players.length, votes]);

  const start = () => {
    if (players.length < 3) return;
    const nextSet = pick(spySets);
    const nextSpy = pick(players).id;
    const nextRoles: Record<string, PrivateRole> = {};
    players.forEach((player, index) => {
      nextRoles[player.id] = player.id === nextSpy ? { spy: true } : { spy: false, place: nextSet.place, clue: nextSet.words[index % nextSet.words.length] };
    });
    setRoundSet(nextSet); setSpyId(nextSpy); setRoles(nextRoles); setVotes({}); setPhase('talk');
  };
  const reset = () => { setRoles({}); setVotes({}); setSpyId(''); setPhase('lobby'); };
  const voteCounts = useMemo(() => players.map(player => ({ ...player, count: Object.values(votes).filter(id => id === player.id).length })).sort((a,b) => b.count - a.count), [players, votes]);
  const accused = voteCounts[0];
  const caught = accused?.id === spyId && (voteCounts[1]?.count ?? 0) < accused.count;
  const copy = async () => { if (!hostUrl) return; try { await navigator.clipboard?.writeText(hostUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* QR is the fallback. */ } };

  return <section className="final-game secret-game" dir="rtl">
    <header className="final-head"><button className="quiet" onClick={onHome}>الألعاب</button><div><span><Sparkles/></span><small>سرّية متعددة الجوالات</small><h1>الكلمة السرّية</h1><p>كل لاعب يستلم دوره على جواله، ولا أحد يحتاج يمرر جهازه للثاني.</p></div></header>
    {phase === 'lobby' ? <article className="final-panel setup-panel">
      <h2>ادخلوا الغرفة من جوالاتكم</h2><p>امسحوا نفس QR من كل جوال، واكتبوا أسماءكم. تبدأ الجولة عند اتصال 3 لاعبين أو أكثر.</p>
      <section className="host-pairing"><div className="host-pairing-copy"><span><Smartphone/> غرفة اللاعبين</span><h3>{players.length} لاعبين متصلين</h3><div className={`host-connection ${players.length >= 3 ? 'connected' : ''}`}>{players.length >= 3 ? <Wifi/> : <RefreshCw className={status === 'starting' ? 'spin' : ''}/>}<b>{status === 'error' ? 'تعذر إنشاء الغرفة' : players.length >= 3 ? 'جاهزين للبدء' : 'بانتظار 3 لاعبين على الأقل'}</b></div><button className="quiet host-copy" disabled={!hostUrl} onClick={copy}>{copied ? <Check/> : <Copy/>}{copied ? 'تم نسخ الرابط' : 'نسخ رابط اللاعبين'}</button></div><div className="host-qr">{qrCode ? <img src={qrCode} alt="QR دخول لعبة الكلمة السرية"/> : <div className="qr-loading"><RefreshCw className="spin"/><span>نجهز الغرفة…</span></div>}</div></section>
      <div className="player-names" style={{ marginTop: 18 }}>{players.map(player => <div key={player.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',border:'1px solid #ffffff18',borderRadius:14}}><Check size={17}/><b>{player.name}</b><small style={{marginInlineStart:'auto'}}>متصل</small></div>)}</div>
      <button className="primary" disabled={players.length < 3} onClick={start}>وزّع الأدوار وابدأ <Users/></button>
    </article> : phase === 'talk' ? <article className="final-panel play-panel"><Users className="feature-icon"/><span className="turn-chip">{players.length} لاعبين</span><h2>الأدوار وصلت للجوالات</h2><p>ابدأوا الأسئلة. لا تذكروا المكان أو الكلمة مباشرة، والمتخفي يحاول يندمج.</p><Countdown seconds={120} stopped={false} onExpire={() => setPhase('vote')}/><button className="primary" onClick={() => setPhase('vote')}><Vote/> الانتقال للتصويت</button></article> : phase === 'vote' ? <article className="final-panel play-panel"><Vote className="feature-icon"/><h2>التصويت من الجوالات</h2><p>كل لاعب يختار شخصًا واحدًا من جواله. التصويت سري حتى يكتمل.</p><strong style={{fontSize:'2rem'}}>{Object.keys(votes).length} / {players.length}</strong><div style={{display:'grid',gap:8,marginTop:18}}>{players.map(player => <div key={player.id} style={{display:'flex',justifyContent:'space-between',padding:'12px 14px',border:'1px solid #ffffff18',borderRadius:14}}><b>{player.name}</b><span>{votes[player.id] ? '✓ صوّت' : 'بانتظار التصويت'}</span></div>)}</div><button className="quiet" disabled={!Object.keys(votes).length} onClick={() => setPhase('result')}>إنهاء التصويت الآن</button></article> : <article className="final-panel final-result"><Trophy/><small>كشف الأدوار</small><h2>{caught ? 'انكشف المتخفي!' : 'المتخفي نجا!'}</h2><p>المتخفي كان <b>{players.find(player => player.id === spyId)?.name}</b> · المكان: <b>{roundSet.place}</b></p>{accused ? <p>أعلى تصويت: <b>{accused.name}</b> ({accused.count})</p> : null}<div style={{display:'grid',gap:8,width:'min(560px,100%)',margin:'16px auto'}}>{voteCounts.map(player => <div key={player.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',border:'1px solid #ffffff18',borderRadius:12}}><span>{player.name}</span><b>{player.count} صوت</b></div>)}</div><button className="primary" onClick={start}><RotateCcw/> جولة جديدة بنفس اللاعبين</button><button className="quiet" onClick={reset}>تغيير اللاعبين</button></article>}
  </section>;
}

export function SecretWordPhone({ roomId, token }: { roomId: string; token: string }) {
  const [status, setStatus] = useState<'connecting'|'connected'|'error'>('connecting');
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [game, setGame] = useState<PhoneState | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);

  useEffect(() => {
    if (!/^qaddha-secret-[\w-]{20,}$/.test(roomId) || !/^[a-f\d]{32}$/i.test(token)) { setStatus('error'); return; }
    const peer = new Peer();
    peer.on('open', () => {
      const connection = peer.connect(roomId, { reliable: true, serialization: 'json', metadata: { token, game: 'secret' } });
      connectionRef.current = connection;
      connection.on('open', () => setStatus('connected'));
      connection.on('data', payload => { if (payload && typeof payload === 'object' && (payload as PhoneState).type === 'secret-phone-state') setGame(payload as PhoneState); });
      connection.on('close', () => setStatus('error'));
      connection.on('error', () => setStatus('error'));
    });
    peer.on('error', () => setStatus('error'));
    return () => { connectionRef.current?.close(); peer.destroy(); };
  }, [roomId, token]);

  const join = (event: FormEvent) => { event.preventDefault(); const clean = name.trim(); if (!clean || !connectionRef.current?.open) return; connectionRef.current.send({ type: 'join', name: clean.slice(0,18) } satisfies ClientMessage); setJoined(true); };
  const vote = (targetId: string) => { if (!connectionRef.current?.open || game?.votedFor) return; connectionRef.current.send({ type: 'vote', targetId } satisfies ClientMessage); };

  return <main className="mobile-host" dir="rtl"><header><span className="host-brand"><Gamepad2/> قدّها</span><span className={`mobile-host-status ${status}`}>{status === 'connected' ? <Wifi/> : <WifiOff/>}{status === 'connected' ? 'متصل بالغرفة' : status === 'error' ? 'تعذر الاتصال' : 'جاري الاتصال…'}</span></header>
    {!joined ? <form className="host-wait" onSubmit={join}><Smartphone/><h1>ادخل اسمك</h1><p>دورك سيظهر على هذا الجوال فقط.</p><input autoFocus maxLength={18} value={name} onChange={event => setName(event.target.value)} placeholder="اسم اللاعب" style={{width:'100%',padding:14,borderRadius:14}}/><button className="primary" disabled={!name.trim() || status !== 'connected'}>دخول الغرفة</button></form> : !game ? <section className="host-wait"><RefreshCw className="spin"/><h1>بانتظار شاشة اللعب…</h1></section> : game.phase === 'lobby' ? <section className="host-wait"><Check/><h1>أنت داخل الغرفة يا {game.playerName}</h1><p>انتظر حتى يبدأ المضيف الجولة.</p></section> : game.phase === 'talk' ? <section className="host-wait"><Eye/><small>دورك السري</small><h1>{game.role?.spy ? 'أنت المتخفي' : game.role?.place}</h1><p>{game.role?.spy ? 'ما تعرف المكان. اسأل بذكاء، حاول تندمج، واستنتج المكان قبل ما يشكون فيك.' : <>تلميحك الخاص: <b>{game.role?.clue}</b><br/>لا تقل المكان أو التلميح مباشرة.</>}</p></section> : game.phase === 'vote' ? <section className="host-wait"><Vote/><h1>{game.votedFor ? 'تم تسجيل صوتك' : 'مين المتخفي؟'}</h1>{game.votedFor ? <p>انتظر باقي اللاعبين. ما تقدر تغيّر صوتك بعد الإرسال.</p> : <div style={{display:'grid',gap:10,width:'100%'}}>{game.players.filter(player => player.id !== game.playerId).map(player => <button className="secondary" key={player.id} onClick={() => vote(player.id)}>{player.name}</button>)}</div>}</section> : <section className="host-wait"><Trophy/><small>انتهت الجولة</small><h1>المتخفي: {game.spyName}</h1><p>المكان كان: <b>{game.place}</b></p></section>}
  </main>;
}
