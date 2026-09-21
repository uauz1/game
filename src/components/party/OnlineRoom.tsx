import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import QRCode from 'qrcode';
import { ArrowRight, Check, Copy, Crown, Eye, Gamepad2, Link2, Minus, Pause, Play, Plus, QrCode, RefreshCw, RotateCcw, Settings2, Share2, Shuffle, Trash2, Trophy, Users, Wifi, WifiOff } from 'lucide-react';

type GameOption = { id: string; title: string; tag: string };
type Player = { id: string; name: string; team: 0 | 1; ready: boolean; host: boolean; connected: boolean; seenAt: number };
type Phase = 'lobby' | 'countdown' | 'playing' | 'results';
type Difficulty = 'mixed' | 'easy' | 'medium' | 'hard';
type Room = {
  type: 'room-snapshot'; version: number; code: string; phase: Phase; gameId: string; players: Player[];
  teamNames: [string, string]; scores: [number, number]; round: number; totalRounds: number; timerSeconds: number;
  difficulty: Difficulty; category: string; maxPlayers: number; startedAt: number | null; roundEndsAt: number | null;
  pausedAt: number | null; answerRevealed: boolean; winner: 0 | 1 | null;
};
type ClientMessage =
  | { type: 'join'; playerId: string; name: string }
  | { type: 'ready'; playerId: string; ready: boolean }
  | { type: 'team'; playerId: string; team: 0 | 1 }
  | { type: 'sync-request' | 'heartbeat'; playerId: string };
type ServerError = { type: 'room-error'; reason: 'duplicate-name' | 'room-full' | 'game-started' | 'removed' | 'host-left'; text: string };

const PLAYER_KEY = 'qaddha.online.player-id';
const ROOM_KEY = 'qaddha.online.host-room.v2';
const MAX_PLAYERS = 12;
const categories = ['الكل', 'عام', 'رياضة', 'ترفيه', 'إسلامي', 'علوم'];
const peerId = (code: string) => `qaddha-room-${code.toLowerCase()}`;
const cleanCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
const cleanName = (value: string) => value.trim().replace(/\s+/g, ' ').slice(0, 18);
const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');
const getPlayerId = () => {
  try { const saved = localStorage.getItem(PLAYER_KEY); if (saved) return saved; const id = crypto.randomUUID(); localStorage.setItem(PLAYER_KEY, id); return id; }
  catch { return crypto.randomUUID(); }
};
const newRoom = (code: string, name: string, gameId: string): Room => ({
  type: 'room-snapshot', version: 1, code, phase: 'lobby', gameId,
  players: [{ id: getPlayerId(), name: cleanName(name) || 'المضيف', team: 0, ready: true, host: true, connected: true, seenAt: Date.now() }],
  teamNames: ['الفريق الأول', 'الفريق الثاني'], scores: [0, 0], round: 1, totalRounds: 8, timerSeconds: 60,
  difficulty: 'mixed', category: 'الكل', maxPlayers: MAX_PLAYERS, startedAt: null, roundEndsAt: null,
  pausedAt: null, answerRevealed: false, winner: null,
});
const normalize = (room: Room): Room => ({ ...room, teamNames: room.teamNames || ['الفريق الأول', 'الفريق الثاني'], timerSeconds: room.timerSeconds || 60, difficulty: room.difficulty || 'mixed', category: room.category || 'الكل', maxPlayers: room.maxPlayers || MAX_PLAYERS, pausedAt: room.pausedAt || null, answerRevealed: room.answerRevealed || false });

function TeamBoard({ room, canRemove, onRemove }: { room: Room; canRemove?: boolean; onRemove?: (id: string) => void }) {
  return <div className="online-team-board">{([0, 1] as const).map(team => <section key={team} className={`online-team team-${team + 1}`}>
    <div><small>{room.teamNames[team]}</small><strong>{room.scores[team]}</strong></div>
    <ul>{room.players.filter(p => p.team === team).map(p => <li key={p.id} className={!p.connected ? 'disconnected' : ''}><span>{p.host ? <Crown/> : <Users/>}{p.name}{p.host && <em>المضيف</em>}</span><b>{p.connected ? p.ready ? <Check/> : 'ينتظر' : 'منقطع'}</b>{canRemove && !p.host && <button className="remove-player" aria-label={`إزالة ${p.name}`} onClick={() => onRemove?.(p.id)}><Trash2/></button>}</li>)}</ul>
  </section>)}</div>;
}

function JoinCard({ code: firstCode, error, onJoin, onBack }: { code: string; error: string; onJoin: (code: string, name: string) => void; onBack: () => void }) {
  const [code, setCode] = useState(firstCode);
  const [name, setName] = useState(() => { try { return localStorage.getItem('qaddha.online.name') || ''; } catch { return ''; } });
  const valid = cleanCode(code).length === 6 && cleanName(name).length >= 2;
  return <section className="online-entry-card"><button className="quiet online-back" onClick={onBack}><ArrowRight/> الرئيسية</button><div className="online-entry-icon"><Link2/></div><small>دخول سريع</small><h1>انضم للغرفة</h1><p>اكتب كود الغرفة واسمك، وبنشبك مع أصحابك مباشرة.</p>{error && <p className="online-form-error" role="alert">{error}</p>}<label><span>كود الغرفة</span><input dir="ltr" autoCapitalize="characters" maxLength={6} value={code} onChange={e => setCode(cleanCode(e.target.value))} placeholder="QDH123"/></label><label><span>اسم اللاعب</span><input maxLength={18} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: نواف"/></label><button className="primary" disabled={!valid} onClick={() => { const value = cleanName(name); try { localStorage.setItem('qaddha.online.name', value); } catch {/* optional */} onJoin(cleanCode(code), value); }}>دخول الغرفة</button></section>;
}

function Header({ room, connected, host, onBack }: { room: Room; connected: boolean; host: boolean; onBack: () => void }) {
  return <header className="online-room-head"><button className="quiet" onClick={onBack}><ArrowRight/> خروج</button><div><span><Gamepad2/></span><div><small>{host ? 'أنت المضيف' : 'غرفة أونلاين'}</small><h1>الغرفة {room.code}</h1></div></div><span className={`online-status ${connected ? 'connected' : 'offline'}`}>{connected ? <Wifi/> : <WifiOff/>}{connected ? 'متصل ومزامن' : 'نعيد الاتصال…'}</span></header>;
}
export default function OnlineRoom({ games, onBack }: { games: GameOption[]; onBack: () => void }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const queryCode = cleanCode(params.get('online') || '');
  const queryHost = cleanCode(params.get('onlineHost') || '');
  const savedName = useMemo(() => { try { return localStorage.getItem('qaddha.online.name') || ''; } catch { return ''; } }, []);
  const [mode, setMode] = useState<'entry' | 'join' | 'host' | 'guest'>(queryHost ? 'host' : queryCode && savedName ? 'guest' : queryCode ? 'join' : 'entry');
  const [hostName, setHostName] = useState(savedName || 'المضيف');
  const [join, setJoin] = useState({ code: queryCode, name: queryCode ? savedName : '' });
  const [room, setRoom] = useState<Room | null>(() => {
    if (!queryHost) return null;
    try { const cached = JSON.parse(sessionStorage.getItem(ROOM_KEY) || 'null') as Room | null; if (cached?.type === 'room-snapshot' && cached.code === queryHost) return normalize({ ...cached, players: cached.players.map(p => ({ ...p, connected: p.host })) }); } catch {/* fresh room */}
    return newRoom(queryHost, 'المضيف', games[0]?.id || 'teams');
  });
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState('');
  const [joinError, setJoinError] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const guestConnection = useRef<DataConnection | null>(null);
  const connections = useRef(new Map<string, DataConnection>());
  const roomRef = useRef<Room | null>(room);
  roomRef.current = room;
  const me = useMemo(getPlayerId, []);
  const roomUrl = useMemo(() => { if (!room) return ''; const url = new URL(window.location.href); url.search = ''; url.searchParams.set('online', room.code); return url.toString(); }, [room]);

  const update = useCallback((fn: (current: Room) => Room) => setRoom(current => {
    if (!current) return current;
    const next = { ...fn(current), version: current.version + 1 };
    roomRef.current = next;
    try { sessionStorage.setItem(ROOM_KEY, JSON.stringify(next)); } catch {/* optional */}
    return next;
  }), []);
  useEffect(() => { if (mode === 'host' && room) connections.current.forEach(c => c.open && c.send(room)); }, [mode, room]);
  useEffect(() => { if (room?.phase !== 'countdown' && room?.phase !== 'playing') return; const timer = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(timer); }, [room?.phase]);
  useEffect(() => { if (roomUrl) QRCode.toDataURL(roomUrl, { width: 300, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#090909', light: '#fff8df' } }).then(setQr).catch(() => setQr('')); }, [roomUrl]);

  useEffect(() => {
    if (mode !== 'host' || !room?.code) return;
    const peer = new Peer(peerId(room.code));
    const active = connections.current;
    peer.on('open', () => setConnected(true));
    peer.on('connection', connection => {
      let joinedId = '';
      const reject = (reason: ServerError['reason'], text: string) => { if (connection.open) connection.send({ type: 'room-error', reason, text } satisfies ServerError); window.setTimeout(() => connection.close(), 250); };
      connection.on('data', raw => {
        if (!raw || typeof raw !== 'object') return;
        const message = raw as ClientMessage;
        if (message.type === 'join') {
          const current = roomRef.current; if (!current) return;
          const name = cleanName(message.name); const existing = current.players.find(p => p.id === message.playerId);
          if (!existing && current.phase !== 'lobby') return reject('game-started', 'اللعبة بدأت بالفعل. انتظر المباراة القادمة.');
          if (!existing && current.players.length >= current.maxPlayers) return reject('room-full', 'الغرفة ممتلئة حاليًا.');
          if (current.players.some(p => p.id !== message.playerId && p.name.localeCompare(name, 'ar', { sensitivity: 'base' }) === 0)) return reject('duplicate-name', 'الاسم مستخدم داخل الغرفة. اختر اسمًا مختلفًا.');
          joinedId = message.playerId; active.get(joinedId)?.close(); active.set(joinedId, connection);
          update(value => ({ ...value, players: existing ? value.players.map(p => p.id === joinedId ? { ...p, name, connected: true, seenAt: Date.now() } : p) : [...value.players, { id: joinedId, name, team: value.players.filter(p => p.team === 0).length <= value.players.filter(p => p.team === 1).length ? 0 : 1, ready: false, host: false, connected: true, seenAt: Date.now() }] }));
          setNotice(`${name} انضم للغرفة`);
        } else if (message.type === 'ready' && joinedId === message.playerId) update(r => ({ ...r, players: r.players.map(p => p.id === joinedId ? { ...p, ready: message.ready, seenAt: Date.now() } : p) }));
        else if (message.type === 'team' && joinedId === message.playerId && roomRef.current?.phase === 'lobby') update(r => ({ ...r, players: r.players.map(p => p.id === joinedId ? { ...p, team: message.team, seenAt: Date.now() } : p) }));
        else if (message.type === 'heartbeat' && joinedId === message.playerId) update(r => ({ ...r, players: r.players.map(p => p.id === joinedId ? { ...p, connected: true, seenAt: Date.now() } : p) }));
        else if (message.type === 'sync-request' && connection.open && roomRef.current) connection.send(roomRef.current);
      });
      connection.on('close', () => { if (joinedId && active.get(joinedId) === connection) active.delete(joinedId); if (joinedId) update(r => ({ ...r, players: r.players.map(p => p.id === joinedId ? { ...p, connected: false } : p) })); });
    });
    peer.on('error', error => { setConnected(false); setNotice(error.type === 'unavailable-id' ? 'الكود مستخدم، أنشئ غرفة جديدة' : 'تعذر الاتصال الآن'); });
    const stale = window.setInterval(() => update(r => ({ ...r, players: r.players.map(p => p.host || Date.now() - p.seenAt < 20000 ? p : { ...p, connected: false }) })), 7000);
    return () => { window.clearInterval(stale); active.forEach(c => { if (c.open) c.send({ type: 'room-error', reason: 'host-left', text: 'غادر المضيف وأُغلقت الغرفة.' } satisfies ServerError); c.close(); }); active.clear(); peer.destroy(); };
  }, [mode, room?.code, update]);

  useEffect(() => {
    if (mode !== 'guest' || !join.code || !join.name) return;
    const peer = new Peer(); let connection: DataConnection | null = null; let retry = 0; let heartbeat = 0; let attempts = 0; let stopped = false;
    const connect = () => {
      if (stopped || peer.destroyed) return;
      setConnected(false); connection?.close(); connection = peer.connect(peerId(join.code), { reliable: true, serialization: 'json' }); guestConnection.current = connection;
      connection.on('open', () => { attempts = 0; setConnected(true); setJoinError(''); connection?.send({ type: 'join', playerId: me, name: join.name } satisfies ClientMessage); connection?.send({ type: 'sync-request', playerId: me } satisfies ClientMessage); heartbeat = window.setInterval(() => connection?.open && connection.send({ type: 'heartbeat', playerId: me } satisfies ClientMessage), 5000); });
      connection.on('data', raw => {
        if (!raw || typeof raw !== 'object') return;
        if ((raw as ServerError).type === 'room-error') { const error = raw as ServerError; setJoinError(error.text); setNotice(error.text); if (error.reason !== 'host-left') setMode('join'); return; }
        if ((raw as Room).type === 'room-snapshot') setRoom(current => !current || (raw as Room).version >= current.version ? normalize(raw as Room) : current);
      });
      connection.on('close', () => { window.clearInterval(heartbeat); setConnected(false); if (!stopped && mode === 'guest') retry = window.setTimeout(connect, 2400); });
      connection.on('error', () => setConnected(false));
    };
    peer.on('open', connect);
    peer.on('error', error => { if (!stopped && (error.type === 'peer-unavailable' || error.type === 'network') && attempts++ < 2) retry = window.setTimeout(connect, 1800); else { setJoinError('الغرفة غير موجودة أو الكود غير صحيح.'); setMode('join'); } });
    return () => { stopped = true; window.clearTimeout(retry); window.clearInterval(heartbeat); connection?.close(); guestConnection.current = null; peer.destroy(); };
  }, [join, me, mode]);

  const create = () => { const code = makeCode(); const next = newRoom(code, hostName, games[0]?.id || 'teams'); try { localStorage.setItem('qaddha.online.name', cleanName(hostName)); sessionStorage.setItem(ROOM_KEY, JSON.stringify(next)); } catch {/* optional */} window.history.replaceState({}, '', `${window.location.pathname}?onlineHost=${code}`); setRoom(next); setMode('host'); };
  const joinRoom = (code: string, name: string) => { setJoin({ code, name }); setRoom(null); setNotice(''); setJoinError(''); setMode('guest'); };
  const send = (message: ClientMessage) => guestConnection.current?.open && guestConnection.current.send(message);
  const localPlayer = room?.players.find(p => p.id === me);
  const allReady = !!room && room.players.filter(p => p.connected).length >= 2 && room.players.filter(p => p.connected).every(p => p.host || p.ready);
  const copy = async () => { try { await navigator.clipboard.writeText(roomUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setNotice('انسخ الرابط من شريط المتصفح'); } };
  const share = async () => navigator.share ? navigator.share({ title: `غرفة قدّها ${room?.code}`, text: `ادخل غرفة قدّها بالكود ${room?.code}`, url: roomUrl }) : copy();
  const start = () => update(r => ({ ...r, phase: 'countdown', scores: [0, 0], round: 1, startedAt: Date.now() + 3500, roundEndsAt: Date.now() + 3500 + r.timerSeconds * 1000, pausedAt: null, answerRevealed: false, winner: null }));
  const lobby = () => update(r => ({ ...r, phase: 'lobby', scores: [0, 0], round: 1, startedAt: null, roundEndsAt: null, pausedAt: null, answerRevealed: false, players: r.players.map(p => ({ ...p, ready: p.host })) }));
  const next = () => update(r => r.round >= r.totalRounds ? { ...r, phase: 'results', winner: r.scores[0] === r.scores[1] ? null : r.scores[0] > r.scores[1] ? 0 : 1, roundEndsAt: null, pausedAt: null } : { ...r, round: r.round + 1, roundEndsAt: Date.now() + r.timerSeconds * 1000, pausedAt: null, answerRevealed: false });
  const pause = () => update(r => r.pausedAt ? { ...r, roundEndsAt: r.roundEndsAt ? r.roundEndsAt + Date.now() - r.pausedAt : null, pausedAt: null } : { ...r, pausedAt: Date.now() });
  const remove = (id: string) => { const c = connections.current.get(id); if (c?.open) c.send({ type: 'room-error', reason: 'removed', text: 'أزالك المضيف من الغرفة.' } satisfies ServerError); c?.close(); connections.current.delete(id); update(r => ({ ...r, players: r.players.filter(p => p.id !== id) })); };
  useEffect(() => { if (mode !== 'host' || room?.phase !== 'countdown' || !room.startedAt) return; const timer = window.setTimeout(() => update(r => ({ ...r, phase: 'playing' })), Math.max(0, room.startedAt - Date.now())); return () => window.clearTimeout(timer); }, [mode, room?.phase, room?.startedAt, update]);

  if (mode === 'entry') return <section className="online-room online-entry" dir="rtl"><button className="quiet online-back" onClick={onBack}><ArrowRight/> الرئيسية</button><div className="online-entry-hero"><span><Wifi/></span><small>قدّها أونلاين</small><h1>غرفة واحدة.<br/><em>والحماس عند الكل.</em></h1><p>سوّ غرفة وشارك الكود، أو ادخل على أصحابك. الفرق والنقاط والجولات تبقى متزامنة.</p></div><div className="online-entry-actions"><article><Crown/><h2>إنشاء غرفة</h2><label><span>اسمك</span><input maxLength={18} value={hostName} onChange={e => setHostName(e.target.value)}/></label><button className="primary" disabled={cleanName(hostName).length < 2} onClick={create}>إنشاء غرفة جديدة</button></article><article><Link2/><h2>عندي كود</h2><p>ادخل باسمك واختر فريقك ثم أعلن جاهزيتك.</p><button className="secondary" onClick={() => setMode('join')}>الانضمام لغرفة</button></article></div></section>;
  if (mode === 'join') return <section className="online-room online-entry" dir="rtl"><JoinCard code={join.code || queryCode} error={joinError} onJoin={joinRoom} onBack={() => queryCode ? onBack() : setMode('entry')}/></section>;
  if (!room) return <section className="online-room online-wait" dir="rtl"><RefreshCw className="spin"/><h1>نربطك بالغرفة…</h1><p>{notice || 'إذا انقطع النت لحظة، بنرجعك لنفس الفريق والجولة تلقائيًا.'}</p><button className="quiet" onClick={() => setMode('join')}>تغيير الكود</button></section>;

  const selected = games.find(g => g.id === room.gameId) || games[0];
  const target = room.phase === 'countdown' ? room.startedAt : room.roundEndsAt;
  const seconds = target ? Math.max(0, Math.ceil((target - (room.pausedAt || now)) / 1000)) : 0;
  return <section className="online-room" dir="rtl"><Header room={room} connected={connected} host={mode === 'host'} onBack={onBack}/>{notice && <p className="online-notice" role="status">{notice}</p>}
    {room.phase === 'lobby' ? <div className="online-lobby-layout"><main className="online-lobby-main"><div className="online-code-card"><div><small>كود الغرفة</small><strong dir="ltr">{room.code}</strong><span>{room.players.filter(p => p.connected).length} من {room.maxPlayers} متصلين</span></div><div className="online-share-actions"><button onClick={copy}>{copied ? <Check/> : <Copy/>}{copied ? 'تم النسخ' : 'نسخ الرابط'}</button><button onClick={share}><Share2/> مشاركة</button></div></div><TeamBoard room={room} canRemove={mode === 'host'} onRemove={remove}/>{mode === 'guest' && localPlayer && <div className="guest-controls"><button className={localPlayer.team === 0 ? 'active' : ''} onClick={() => send({ type: 'team', playerId: me, team: 0 })}>{room.teamNames[0]}</button><button className={localPlayer.team === 1 ? 'active' : ''} onClick={() => send({ type: 'team', playerId: me, team: 1 })}>{room.teamNames[1]}</button><button className={`ready ${localPlayer.ready ? 'active' : ''}`} onClick={() => send({ type: 'ready', playerId: me, ready: !localPlayer.ready })}>{localPlayer.ready ? <><Check/> جاهز</> : 'أعلن جاهزيتي'}</button></div>}{mode === 'host' && <div className="host-lobby-controls"><div className="host-settings-title"><Settings2/><div><b>إعداد المباراة</b><small>كل الخيارات في مكان واحد</small></div></div><label><span>اللعبة</span><select value={room.gameId} onChange={e => update(r => ({ ...r, gameId: e.target.value }))}>{games.map(g => <option value={g.id} key={g.id}>{g.title}</option>)}</select></label><label><span>عدد الجولات</span><select value={room.totalRounds} onChange={e => update(r => ({ ...r, totalRounds: Number(e.target.value) }))}>{[4, 6, 8, 10, 12].map(n => <option key={n}>{n}</option>)}</select></label><label><span>المؤقت</span><select value={room.timerSeconds} onChange={e => update(r => ({ ...r, timerSeconds: Number(e.target.value) }))}>{[30, 45, 60, 90, 120].map(n => <option key={n} value={n}>{n} ثانية</option>)}</select></label><label><span>الصعوبة</span><select value={room.difficulty} onChange={e => update(r => ({ ...r, difficulty: e.target.value as Difficulty }))}><option value="mixed">متنوعة</option><option value="easy">سهلة</option><option value="medium">متوسطة</option><option value="hard">صعبة</option></select></label><label><span>التصنيف</span><select value={room.category} onChange={e => update(r => ({ ...r, category: e.target.value }))}>{categories.map(value => <option key={value}>{value}</option>)}</select></label><label><span>اسم الفريق الأول</span><input maxLength={16} value={room.teamNames[0]} onChange={e => update(r => ({ ...r, teamNames: [cleanName(e.target.value), r.teamNames[1]] }))}/></label><label><span>اسم الفريق الثاني</span><input maxLength={16} value={room.teamNames[1]} onChange={e => update(r => ({ ...r, teamNames: [r.teamNames[0], cleanName(e.target.value)] }))}/></label><button className="quiet auto-balance" onClick={() => update(r => ({ ...r, players: r.players.map((p, i) => ({ ...p, team: i % 2 as 0 | 1 })) }))}><Shuffle/> موازنة الفرق</button><button className="primary start-online" disabled={!allReady || !room.teamNames.every(Boolean)} onClick={start}><Gamepad2/> {room.players.filter(p => p.connected).length < 2 ? 'بانتظار لاعب آخر' : !allReady ? 'بانتظار الجاهزية' : `ابدأ ${selected?.title}`}</button></div>}</main><aside className="online-qr"><div>{qr ? <img src={qr} alt={`رمز دخول غرفة ${room.code}`}/> : <QrCode/>}</div><h3>دخول بالكاميرا</h3><p>امسح الرمز أو افتح الرابط، ثم اكتب اسمك واختر فريقك.</p><dl><div><dt>اللعبة</dt><dd>{selected?.title}</dd></div><div><dt>الجولات</dt><dd>{room.totalRounds}</dd></div><div><dt>الوقت</dt><dd>{room.timerSeconds}ث</dd></div><div><dt>التصنيف</dt><dd>{room.category}</dd></div></dl></aside></div> : <main className="online-live"><div className="online-game-banner"><small>{room.phase === 'countdown' ? 'اللعبة تبدأ الآن' : room.phase === 'results' ? 'انتهت المباراة' : `الجولة ${room.round} من ${room.totalRounds}`}</small><h2>{selected?.title}</h2><p>{room.phase === 'countdown' ? 'استعدوا… كل الأجهزة متزامنة.' : room.phase === 'results' ? 'النتيجة النهائية محفوظة داخل الغرفة.' : `${selected?.tag} · ${room.category}`}</p>{room.phase !== 'results' && <strong className={`online-synced-timer ${seconds <= 5 ? 'urgent' : ''}`}>{room.pausedAt ? <Pause/> : seconds || 'انتهى'}</strong>}{room.answerRevealed && <span className="answer-revealed"><Eye/> الإجابة مكشوفة</span>}{mode === 'host' && room.phase === 'playing' && <button className="quiet open-game-screen" onClick={() => window.open(`${window.location.pathname}?play=${room.gameId}`, 'qaddha-game')}><Gamepad2/> افتح اللعبة على الشاشة</button>}</div><TeamBoard room={room} canRemove={mode === 'host'} onRemove={remove}/>{mode === 'host' && room.phase === 'playing' && <div className="online-host-score">{([0, 1] as const).map(team => <section key={team}><span>{room.teamNames[team]}</span><button onClick={() => update(r => ({ ...r, scores: team === 0 ? [Math.max(0, r.scores[0] - 1), r.scores[1]] : [r.scores[0], Math.max(0, r.scores[1] - 1)] }))}><Minus/></button><strong>{room.scores[team]}</strong><button onClick={() => update(r => ({ ...r, scores: team === 0 ? [r.scores[0] + 1, r.scores[1]] : [r.scores[0], r.scores[1] + 1] }))}><Plus/></button></section>)}<div className="online-round-actions"><button onClick={pause}>{room.pausedAt ? <Play/> : <Pause/>}{room.pausedAt ? 'استئناف' : 'إيقاف مؤقت'}</button><button className={room.answerRevealed ? 'active' : ''} onClick={() => update(r => ({ ...r, answerRevealed: !r.answerRevealed }))}><Eye/>{room.answerRevealed ? 'إخفاء الإجابة' : 'كشف الإجابة'}</button><button className="secondary" onClick={next}>{room.round >= room.totalRounds ? 'إنهاء المباراة' : 'الجولة التالية'}</button><button onClick={lobby}>العودة للوبي</button></div></div>}{room.phase === 'results' && <div className="online-results"><Trophy/><h2>{room.winner === null ? 'تعادل قوي!' : `${room.teamNames[room.winner]} فاز`}</h2>{mode === 'host' ? <div><button className="primary" onClick={start}><RotateCcw/> إعادة المباراة</button><button className="secondary" onClick={lobby}>لعبة أو إعدادات جديدة</button></div> : <p>المضيف يختار إعادة المباراة أو تغيير اللعبة.</p>}</div>}</main>}
  </section>;
}
