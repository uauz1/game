import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { ArrowRight, Check, Copy, Crown, Eye, Gamepad2, Link2, Minus, Pause, Play, Plus, QrCode, RefreshCw, RotateCcw, Settings2, Share2, Shuffle, Trash2, Trophy, Users, Wifi, WifiOff } from 'lucide-react';
import { getAuthClient } from '../../utils/authClient';
import type { OnlineGameAction } from '../../utils/onlineEmbedBridge';

type GameOption = { id: string; title: string; tag: string };
type Player = { id: string; name: string; team: 0 | 1; ready: boolean; host: boolean; connected: boolean; seenAt: number; gameLoadedId?: string };
type Phase = 'lobby' | 'countdown' | 'playing' | 'results';
type Difficulty = 'mixed' | 'easy' | 'medium' | 'hard';
type Room = {
  type: 'room-snapshot'; version: number; code: string; phase: Phase; gameId: string; players: Player[];
  teamNames: [string, string]; scores: [number, number]; round: number; totalRounds: number; timerSeconds: number;
  difficulty: Difficulty; category: string; maxPlayers: number; startedAt: number | null; roundEndsAt: number | null;
  pausedAt: number | null; answerRevealed: boolean; winner: 0 | 1 | null; gameActions: OnlineGameAction[]; gameRevision: number;
};
type ClientMessage =
  | { type: 'join'; playerId: string; name: string }
  | { type: 'ready'; playerId: string; ready: boolean }
  | { type: 'team'; playerId: string; team: 0 | 1 }
  | { type: 'game-loaded'; playerId: string; gameId: string }
  | { type: 'game-action'; playerId: string; action: OnlineGameAction }
  | { type: 'resync-game'; playerId: string }
  | { type: 'sync-request' | 'heartbeat'; playerId: string };
type ServerError = { type: 'room-error'; reason: 'duplicate-name' | 'room-full' | 'game-started' | 'removed' | 'host-left'; text: string; targetId?: string };

const PLAYER_KEY = 'qaddha.online.player-id';
const ROOM_KEY_PREFIX = 'qaddha.online.host-room.v3:';
const HOST_TOKEN_PREFIX = 'qaddha.online.host-token.v1:';
const MAX_PLAYERS = 12;
const categories = ['الكل', 'عام', 'رياضة', 'ترفيه', 'إسلامي', 'علوم'];
const roundOptionsForGame = (gameId: string) => {
  if (gameId === 'letters') return [1, 3, 5];
  if (gameId === 'teams') return [6, 12, 18, 24, 30];
  if (['who','acting','pressure','intruder'].includes(gameId)) return [6, 8, 10];
  if (gameId === 'secret') return [1];
  return [4, 6, 8];
};
const timerOptionsForGame = (gameId: string) => {
  if (gameId === 'secret') return [90, 120, 180];
  if (['who','acting','pressure','intruder'].includes(gameId)) return [30, 45, 60];
  return [20, 30, 45, 60];
};
const closestAllowed = (value: number, options: number[]) => options.includes(value) ? value : options[Math.min(1, options.length - 1)];
const cleanCode = (value: string) => value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6);
const cleanName = (value: string) => value.trim().replace(/\s+/g, ' ').slice(0, 18);
const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');
const getPlayerId = () => {
  try { const saved = localStorage.getItem(PLAYER_KEY); if (saved) return saved; const id = crypto.randomUUID(); localStorage.setItem(PLAYER_KEY, id); return id; }
  catch { return crypto.randomUUID(); }
};
const makeHostToken = () => `${crypto.randomUUID()}-${crypto.randomUUID()}`;
const getHostToken = (code: string) => { try { return localStorage.getItem(`${HOST_TOKEN_PREFIX}${code}`) || ''; } catch { return ''; } };
const saveHostToken = (code: string, token: string) => { try { localStorage.setItem(`${HOST_TOKEN_PREFIX}${code}`, token); } catch {/* optional */} };
const newRoom = (code: string, name: string, gameId: string): Room => ({
  type: 'room-snapshot', version: 1, code, phase: 'lobby', gameId,
  players: [{ id: getPlayerId(), name: cleanName(name) || 'المضيف', team: 0, ready: true, host: true, connected: true, seenAt: Date.now() }],
  teamNames: ['الفريق الأول', 'الفريق الثاني'], scores: [0, 0], round: 1, totalRounds: 8, timerSeconds: 60,
  difficulty: 'mixed', category: 'الكل', maxPlayers: MAX_PLAYERS, startedAt: null, roundEndsAt: null,
  pausedAt: null, answerRevealed: false, winner: null, gameActions: [], gameRevision: 0,
});
const normalize = (room: Room): Room => ({ ...room, teamNames: room.teamNames || ['الفريق الأول', 'الفريق الثاني'], timerSeconds: room.timerSeconds || 60, difficulty: room.difficulty || 'mixed', category: room.category || 'الكل', maxPlayers: room.maxPlayers || MAX_PLAYERS, pausedAt: room.pausedAt || null, answerRevealed: room.answerRevealed || false, gameActions: Array.isArray(room.gameActions) ? room.gameActions.slice(-120) : [], gameRevision: Number.isFinite(room.gameRevision) ? room.gameRevision : 0 });
const normalizeGameAction = (action: OnlineGameAction, playerId: string, gameId: string): OnlineGameAction | null => {
  if (!action || action.gameId !== gameId || typeof action.id !== 'string' || typeof action.selector !== 'string') return null;
  if (!['click','input','change'].includes(action.kind) || action.id.length > 160 || action.selector.length > 500) return null;
  const value = typeof action.value === 'string' ? action.value.slice(0, 300) : action.value;
  if (typeof value !== 'undefined' && typeof value !== 'string' && typeof value !== 'boolean') return null;
  return { ...action, sourceId: playerId, gameId, selector: action.selector.slice(0, 500), value, sentAt: Number.isFinite(action.sentAt) ? action.sentAt : Date.now() };
};

function TeamBoard({ room, canRemove, onRemove }: { room: Room; canRemove?: boolean; onRemove?: (id: string) => void }) {
  return <div className="online-team-board">{([0, 1] as const).map(team => <section key={team} className={`online-team team-${team + 1}`}>
    <div><small>{room.teamNames[team]}</small><strong>{room.scores[team]}</strong></div>
    <ul>{room.players.filter(p => p.team === team).map(p => <li key={p.id} className={!p.connected ? 'disconnected' : ''}><span>{p.host ? <Crown/> : <Users/>}{p.name}{p.host && <em>المضيف</em>}</span><b>{p.connected ? p.ready ? <Check/> : 'ينتظر' : 'منقطع'}</b>{canRemove && !p.host && <button className="remove-player" aria-label={`إزالة ${p.name}`} onClick={() => onRemove?.(p.id)}><Trash2/></button>}</li>)}</ul>
  </section>)}</div>;
}

function IndividualBoard({ room, canRemove, onRemove }: { room: Room; canRemove?: boolean; onRemove?: (id: string) => void }) {
  return <div className="online-individual-board"><header><Users/><div><small>اللاعبون</small><strong>{room.players.filter(player => player.connected).length} متصلين</strong></div></header><ul>{room.players.map(player => <li key={player.id} className={!player.connected ? 'disconnected' : ''}><span>{player.host ? <Crown/> : <Users/>}<b>{player.name}</b>{player.host && <em>المضيف</em>}</span><strong>{player.connected ? player.ready ? <><Check/> جاهز</> : 'ينتظر' : 'منقطع'}</strong>{canRemove && !player.host && <button className="remove-player" aria-label={`إزالة ${player.name}`} onClick={() => onRemove?.(player.id)}><Trash2/></button>}</li>)}</ul></div>;
}

function JoinCard({ code: firstCode, error, onJoin, onBack }: { code: string; error: string; onJoin: (code: string, name: string) => void | Promise<void>; onBack: () => void }) {
  const [code, setCode] = useState(firstCode);
  const [name, setName] = useState(() => { try { return localStorage.getItem('qaddha.online.name') || ''; } catch { return ''; } });
  const [joining, setJoining] = useState(false);
  const valid = cleanCode(code).length === 6 && cleanName(name).length >= 2;
  return <section className="online-entry-card"><button className="quiet online-back" onClick={onBack}><ArrowRight/> الرئيسية</button><div className="online-entry-icon"><Link2/></div><small>دخول سريع · بدون حساب</small><h1>انضم للغرفة</h1><p>اكتب كود الغرفة واسمك فقط. ما تحتاج تسجيل دخول عشان تلعب مع أصحابك.</p>{error && <p className="online-form-error" role="alert">{error}</p>}<label><span>كود الغرفة</span><input dir="ltr" autoCapitalize="characters" maxLength={6} value={code} onChange={e => setCode(cleanCode(e.target.value))} placeholder="QDH123"/></label><label><span>اسم اللاعب</span><input maxLength={18} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: نواف"/></label><button className="primary" disabled={!valid || joining} onClick={async () => {
  const value = cleanName(name);
  try { localStorage.setItem('qaddha.online.name', value); } catch {/* optional */}
  setJoining(true);
  try { await onJoin(cleanCode(code), value); } finally { setJoining(false); }
}}>{joining ? 'نتأكد من الغرفة…' : 'دخول الغرفة'}</button></section>;
}

function Header({ room, connected, host, onBack }: { room: Room; connected: boolean; host: boolean; onBack: () => void }) {
  return <header className="online-room-head"><button className="quiet" onClick={onBack}><ArrowRight/> خروج</button><div><span><Gamepad2/></span><div><small>{host ? 'أنت المضيف' : 'غرفة أونلاين'}</small><h1>الغرفة {room.code}</h1></div></div><span className={`online-status ${connected ? 'connected' : 'offline'}`}>{connected ? <Wifi/> : <WifiOff/>}{connected ? 'متصل ومزامن' : 'نعيد الاتصال…'}</span></header>;
}
export default function OnlineRoom({ games, onBack }: { games: GameOption[]; onBack: () => void }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const queryCode = cleanCode(params.get('online') || '');
  const queryHost = cleanCode(params.get('onlineHost') || '');
  const savedName = useMemo(() => { try { return localStorage.getItem('qaddha.online.name') || ''; } catch { return ''; } }, []);
  const hostAccessToken = useMemo(() => queryHost ? getHostToken(queryHost) : '', [queryHost]);
  const [mode, setMode] = useState<'entry' | 'join' | 'host' | 'guest'>(queryHost ? (hostAccessToken ? 'host' : 'join') : queryCode && savedName ? 'guest' : queryCode ? 'join' : 'entry');
  const [hostName, setHostName] = useState(savedName || 'المضيف');
  const [join, setJoin] = useState({ code: queryCode || (queryHost && !hostAccessToken ? queryHost : ''), name: (queryCode || queryHost) ? savedName : '' });
  const [room, setRoom] = useState<Room | null>(() => {
    if (!queryHost) return null;
    try { const cached = JSON.parse(localStorage.getItem(`${ROOM_KEY_PREFIX}${queryHost}`) || 'null') as Room | null; if (cached?.type === 'room-snapshot' && cached.code === queryHost) return normalize({ ...cached, players: cached.players.map(p => ({ ...p, connected: p.host })) }); } catch {/* restore from Supabase below */}
    return null;
  });
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [hostToken, setHostToken] = useState(hostAccessToken);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const actionRateRef = useRef(new Map<string, { startedAt: number; count: number }>());
  const actionPersistTimerRef = useRef(0);
  const roomRef = useRef<Room | null>(room);
  roomRef.current = room;
  const me = useMemo(getPlayerId, []);
  const roomUrl = useMemo(() => { if (!room) return ''; const url = new URL(window.location.href); url.search = ''; url.searchParams.set('online', room.code); return url.toString(); }, [room]);

  const persistRoom = useCallback(async (snapshot: Room, token = hostToken) => {
    if (!token) return;
    try {
      const client = await getAuthClient();
      await client.rpc('qaddha_guest_save_room', { p_code: snapshot.code, p_host_token: token, p_state: snapshot });
    } catch { /* realtime remains primary; local cache is fallback */ }
  }, [hostToken]);

  const update = useCallback((fn: (current: Room) => Room, shouldPersist = true) => setRoom(current => {
    if (!current) return current;
    const next = { ...fn(current), version: current.version + 1 };
    roomRef.current = next;
    try { localStorage.setItem(`${ROOM_KEY_PREFIX}${next.code}`, JSON.stringify(next)); } catch {/* optional */}
    if (shouldPersist) void persistRoom(next);
    return next;
  }), [persistRoom]);
  const rememberGameAction = useCallback((action: OnlineGameAction) => {
    update(r => r.gameId !== action.gameId ? r : ({ ...r, gameActions: [...(r.gameActions || []), action].slice(-120) }), false);
    window.clearTimeout(actionPersistTimerRef.current);
    actionPersistTimerRef.current = window.setTimeout(() => {
      const snapshot = roomRef.current;
      if (snapshot) void persistRoom(snapshot);
    }, 450);
  }, [persistRoom, update]);
  const allowGameAction = useCallback((playerId: string) => {
    const now = Date.now();
    const current = actionRateRef.current.get(playerId);
    if (!current || now - current.startedAt > 5000) {
      actionRateRef.current.set(playerId, { startedAt: now, count: 1 });
      return true;
    }
    if (current.count >= 80) return false;
    current.count += 1;
    return true;
  }, []);
  const replayStoredActions = useCallback((snapshot: Room | null) => {
    if (!snapshot?.gameActions?.length) return;
    const frame = document.getElementById('qaddha-online-game-frame') as HTMLIFrameElement | null;
    if (!frame?.contentWindow) return;
    for (const action of snapshot.gameActions) {
      if (action.gameId !== snapshot.gameId) continue;
      frame.contentWindow.postMessage({ type: 'qaddha-online-replay', action }, window.location.origin);
    }
  }, []);
  useEffect(() => {
    if (mode !== 'host' || !room || !connected || !channelRef.current) return;
    void channelRef.current.send({ type: 'broadcast', event: 'server-message', payload: room });
  }, [mode, room, connected]);
  useEffect(() => () => window.clearTimeout(actionPersistTimerRef.current), []);

  useEffect(() => {
    if (!room || (room.phase !== 'countdown' && room.phase !== 'playing')) return;
    replayStoredActions(room);
  }, [room?.gameActions?.length, room?.gameRevision, room?.gameId, room?.phase, replayStoredActions]);
  useEffect(() => { if (room?.phase !== 'countdown') return; const timer = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(timer); }, [room?.phase]);
  useEffect(() => { if (roomUrl) QRCode.toDataURL(roomUrl, { width: 300, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#090909', light: '#fff8df' } }).then(setQr).catch(() => setQr('')); }, [roomUrl]);

  useEffect(() => {
    if (mode !== 'host' || !queryHost) return;
    let cancelled = false;
    void getAuthClient().then(client => client.rpc('qaddha_guest_get_room', { p_code: queryHost })).then(({ data }) => {
      if (cancelled) return;
      if (!Array.isArray(data) || !data[0]?.state) {
        try {
          localStorage.removeItem(`${ROOM_KEY_PREFIX}${queryHost}`);
          localStorage.removeItem(`${HOST_TOKEN_PREFIX}${queryHost}`);
        } catch {/* optional */}
        roomRef.current = null;
        setRoom(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('onlineHost');
        window.history.replaceState({}, '', url);
        setHostToken('');
        setNotice('الغرفة انتهت أو أُغلقت. أنشئ غرفة جديدة.');
        setMode('entry');
        return;
      }
      const restored = normalize(data[0].state as Room);
      setRoom(current => !current || restored.version >= current.version ? restored : current);
      roomRef.current = !roomRef.current || restored.version >= roomRef.current.version ? restored : roomRef.current;
      try {
        const current = roomRef.current;
        if (current) localStorage.setItem(`${ROOM_KEY_PREFIX}${queryHost}`, JSON.stringify(current));
      } catch {/* optional */}
    }).catch(() => {
      if (!cancelled && !roomRef.current) setNotice('تعذر التحقق من الغرفة الآن. تأكد من اتصالك ثم جرّب ثانية.');
    });
    return () => { cancelled = true; };
  }, [mode, queryHost]);

  useEffect(() => {
    if (mode !== 'host' || !room?.code) return;
    let active = true;
    let stale = 0;
    let client: Awaited<ReturnType<typeof getAuthClient>> | null = null;
    const topic = `qaddha-room:${room.code.toLowerCase()}`;

    void getAuthClient().then(instance => {
      if (!active) return;
      client = instance;
      const channel = instance.channel(topic, {
        config: {
          broadcast: { ack: true, self: false },
          presence: { key: `host-${me}` },
        },
      });
      channelRef.current = channel;

      const reject = (playerId: string, reason: ServerError['reason'], text: string) => {
        void channel.send({ type: 'broadcast', event: 'server-message', payload: { type: 'room-error', reason, text, targetId: playerId } satisfies ServerError });
      };

      channel.on('broadcast', { event: 'client-message' }, message => {
        const raw = message.payload;
        if (!raw || typeof raw !== 'object') return;
        const incoming = raw as ClientMessage;
        const current = roomRef.current;
        if (!current) return;

        if (incoming.type === 'join') {
          const name = cleanName(incoming.name);
          const existing = current.players.find(p => p.id === incoming.playerId);
          if (!existing && current.phase !== 'lobby') return reject(incoming.playerId, 'game-started', 'اللعبة بدأت بالفعل. انتظر المباراة القادمة.');
          if (!existing && current.players.length >= current.maxPlayers) return reject(incoming.playerId, 'room-full', 'الغرفة ممتلئة حاليًا.');
          if (current.players.some(p => p.id !== incoming.playerId && p.name.localeCompare(name, 'ar', { sensitivity: 'base' }) === 0)) return reject(incoming.playerId, 'duplicate-name', 'الاسم مستخدم داخل الغرفة. اختر اسمًا مختلفًا.');
          update(value => ({
            ...value,
            players: existing
              ? value.players.map(p => p.id === incoming.playerId ? { ...p, name, connected: true, seenAt: Date.now() } : p)
              : [...value.players, {
                  id: incoming.playerId,
                  name,
                  team: value.players.filter(p => p.team === 0).length <= value.players.filter(p => p.team === 1).length ? 0 : 1,
                  ready: false,
                  host: false,
                  connected: true,
                  seenAt: Date.now(),
                }],
          }));
          setNotice(`${name} انضم للغرفة`);
        } else if (incoming.type === 'ready') {
          update(r => ({ ...r, players: r.players.map(p => p.id === incoming.playerId ? { ...p, ready: incoming.ready, connected: true, seenAt: Date.now() } : p) }));
        } else if (incoming.type === 'team' && current.phase === 'lobby') {
          update(r => ({ ...r, players: r.players.map(p => p.id === incoming.playerId ? { ...p, team: incoming.team, connected: true, seenAt: Date.now() } : p) }));
        } else if (incoming.type === 'game-loaded') {
          update(r => ({ ...r, players: r.players.map(p => p.id === incoming.playerId ? { ...p, gameLoadedId: incoming.gameId, connected: true, seenAt: Date.now() } : p) }), false);
        } else if (incoming.type === 'game-action') {
          if (!allowGameAction(incoming.playerId)) return;
          const action = normalizeGameAction(incoming.action, incoming.playerId, current.gameId);
          if (!action) return;
          const frame = document.getElementById('qaddha-online-game-frame') as HTMLIFrameElement | null;
          frame?.contentWindow?.postMessage({ type: 'qaddha-online-replay', action }, window.location.origin);
          rememberGameAction(action);
          void channel.send({ type: 'broadcast', event: 'server-message', payload: { type: 'game-action', action } });
        } else if (incoming.type === 'resync-game') {
          if (current.phase === 'countdown' || current.phase === 'playing') {
            update(r => ({ ...r, gameRevision: r.gameRevision + 1, players: r.players.map(p => ({ ...p, gameLoadedId: undefined })) }));
            setNotice('أعدنا مزامنة اللعبة لكل الأجهزة.');
            window.setTimeout(() => setNotice(''), 1800);
          }
        } else if (incoming.type === 'heartbeat') {
          update(r => ({ ...r, players: r.players.map(p => p.id === incoming.playerId ? { ...p, connected: true, seenAt: Date.now() } : p) }), false);
        } else if (incoming.type === 'sync-request') {
          const snapshot = roomRef.current;
          if (snapshot) void channel.send({ type: 'broadcast', event: 'server-message', payload: snapshot });
        }
      });

      channel.subscribe(async status => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          setNotice('');
          await channel.track({ role: 'host', playerId: me, onlineAt: Date.now() });
          if (roomRef.current) void channel.send({ type: 'broadcast', event: 'server-message', payload: roomRef.current });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnected(false);
          setNotice('نعيد الاتصال بالغرفة…');
        }
      });

      stale = window.setInterval(() => update(r => ({
        ...r,
        players: r.players.map(p => p.host || Date.now() - p.seenAt < 20000 ? p : { ...p, connected: false }),
      }), false), 7000);
    }).catch(() => {
      if (!active) return;
      setConnected(false);
      setNotice('تعذر تشغيل المزامنة الآن.');
    });

    return () => {
      active = false;
      window.clearInterval(stale);
      const channel = channelRef.current;
      channelRef.current = null;
      if (channel) {
        void channel.untrack();
        if (client) void client.removeChannel(channel);
      }
    };
  }, [mode, room?.code, me, update, rememberGameAction, allowGameAction]);

  useEffect(() => {
    if (mode !== 'guest' || !join.code || !join.name) return;
    let active = true;
    let heartbeat = 0;
    let roomTimeout = 0;
    let resync = 0;
    let visibilityHandler: (() => void) | null = null;
    let receivedSnapshot = false;
    let client: Awaited<ReturnType<typeof getAuthClient>> | null = null;
    const topic = `qaddha-room:${join.code.toLowerCase()}`;

    void getAuthClient().then(instance => {
      if (!active) return;
      client = instance;
      const channel = instance.channel(topic, {
        config: {
          broadcast: { ack: true, self: false },
          presence: { key: `guest-${me}` },
        },
      });
      channelRef.current = channel;
      const pullPersistedRoom = async () => {
        if (!active) return;
        try {
          const { data } = await instance.rpc('qaddha_guest_get_room', { p_code: join.code });
          if (!Array.isArray(data) || !data[0]?.state) return;
          const persisted = normalize(data[0].state as Room);
          receivedSnapshot = true;
          setRoom(current => !current || persisted.version >= current.version ? persisted : current);
        } catch { /* realtime broadcast remains the fast path */ }
      };
      visibilityHandler = () => {
        if (document.visibilityState !== 'visible') return;
        void pullPersistedRoom();
        void channel.send({ type: 'broadcast', event: 'client-message', payload: { type: 'sync-request', playerId: me } satisfies ClientMessage });
      };
      document.addEventListener('visibilitychange', visibilityHandler);

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const hostOnline = Object.values(state).flat().some((presence: any) => presence?.role === 'host');
        setConnected(hostOnline);
        if (!hostOnline) setNotice('المضيف غير متصل الآن. بنرجع نربطك تلقائيًا أول ما يرجع.');
        else setNotice('');
      });

      channel.on('broadcast', { event: 'server-message' }, message => {
        const raw = message.payload;
        if (!raw || typeof raw !== 'object') return;
        if ((raw as ServerError).type === 'room-error') {
          const error = raw as ServerError;
          if (error.targetId && error.targetId !== me) return;
          setJoinError(error.text);
          setNotice(error.text);
          setConnected(false);
          setMode('join');
          return;
        }
        if ((raw as { type?: string }).type === 'game-action') {
          const action = (raw as { type: 'game-action'; action: OnlineGameAction }).action;
          if (action?.gameId !== roomRef.current?.gameId) return;
          if (action?.sourceId !== me) {
            const frame = document.getElementById('qaddha-online-game-frame') as HTMLIFrameElement | null;
            frame?.contentWindow?.postMessage({ type: 'qaddha-online-replay', action }, window.location.origin);
          }
          return;
        }
        if ((raw as Room).type === 'room-snapshot') {
          receivedSnapshot = true;
          window.clearTimeout(roomTimeout);
          setConnected(true);
          setJoinError('');
          setRoom(current => !current || (raw as Room).version >= current.version ? normalize(raw as Room) : current);
        }
      });

      channel.subscribe(async status => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          await pullPersistedRoom();
          window.clearInterval(resync);
          resync = window.setInterval(() => { if (document.visibilityState === 'visible') void pullPersistedRoom(); }, 4000);
          await channel.track({ role: 'guest', playerId: me, name: join.name, onlineAt: Date.now() });
          await channel.send({ type: 'broadcast', event: 'client-message', payload: { type: 'join', playerId: me, name: join.name } satisfies ClientMessage });
          await channel.send({ type: 'broadcast', event: 'client-message', payload: { type: 'sync-request', playerId: me } satisfies ClientMessage });
          const activeRoom = roomRef.current;
          if (activeRoom && (activeRoom.phase === 'countdown' || activeRoom.phase === 'playing')) {
            await channel.send({ type: 'broadcast', event: 'client-message', payload: { type: 'game-loaded', playerId: me, gameId: activeRoom.gameId } satisfies ClientMessage });
          }
          window.clearInterval(heartbeat);
          heartbeat = window.setInterval(() => {
            const known = roomRef.current?.players.some(player => player.id === me);
            const payload: ClientMessage = known
              ? { type: 'heartbeat', playerId: me }
              : { type: 'join', playerId: me, name: join.name };
            void channel.send({ type: 'broadcast', event: 'client-message', payload });
          }, 5000);
          window.clearTimeout(roomTimeout);
          roomTimeout = window.setTimeout(() => {
            if (!receivedSnapshot && active) {
              setConnected(false);
              setJoinError('الغرفة غير موجودة أو الكود غير صحيح.');
              setMode('join');
            }
          }, 6500);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnected(false);
          setNotice('نعيد الاتصال بالغرفة…');
        }
      });
    }).catch(() => {
      if (!active) return;
      setConnected(false);
      setJoinError('تعذر الاتصال بخدمة الغرف الآن.');
      setMode('join');
    });

    return () => {
      active = false;
      window.clearInterval(heartbeat);
      window.clearInterval(resync);
      window.clearTimeout(roomTimeout);
      if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
      const channel = channelRef.current;
      channelRef.current = null;
      if (channel) {
        void channel.untrack();
        if (client) void client.removeChannel(channel);
      }
    };
  }, [join, me, mode]);

  const create = async () => {
    const name = cleanName(hostName);
    if (name.length < 2 || creating) return;
    setCreating(true);
    setNotice('نجهز الغرفة…');
    try {
      const client = await getAuthClient();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const code = makeCode();
        const token = makeHostToken();
        const next = newRoom(code, name, games[0]?.id || 'teams');
        const { error } = await client.rpc('qaddha_guest_create_room', { p_code: code, p_host_token: token, p_state: next });
        if (error) {
          if (String(error.message || '').includes('ROOM_CODE_TAKEN')) continue;
          throw error;
        }
        saveHostToken(code, token);
        setHostToken(token);
        try { localStorage.setItem('qaddha.online.name', name); localStorage.setItem(`${ROOM_KEY_PREFIX}${code}`, JSON.stringify(next)); } catch {/* optional */}
        window.history.replaceState({}, '', `${window.location.pathname}?onlineHost=${code}`);
        setRoom(next);
        roomRef.current = next;
        setMode('host');
        setNotice('');
        setCreating(false);
        return;
      }
      throw new Error('ROOM_CODE_RETRY_FAILED');
    } catch {
      setNotice('تعذر إنشاء الغرفة الآن. جرّب مرة ثانية.');
      setCreating(false);
    }
  };
  const joinRoom = async (code: string, name: string) => {
    const clean = cleanCode(code);
    const playerName = cleanName(name);
    setJoinError('');
    setNotice('نتأكد من الغرفة…');
    try {
      const client = await getAuthClient();
      const { data, error } = await client.rpc('qaddha_guest_get_room', { p_code: clean });
      if (error || !Array.isArray(data) || !data[0]?.state) {
        setJoinError('الغرفة غير موجودة أو انتهت صلاحيتها.');
        setNotice('');
        return;
      }
      const snapshot = normalize(data[0].state as Room);
      const existing = snapshot.players.find(player => player.id === me);
      if (!existing && snapshot.phase !== 'lobby') {
        setJoinError('المباراة بدأت بالفعل. انتظر لين يرجع المضيف للوبي.');
        setNotice('');
        return;
      }
      if (!existing && snapshot.players.length >= snapshot.maxPlayers) {
        setJoinError('الغرفة ممتلئة حاليًا.');
        setNotice('');
        return;
      }
      if (snapshot.players.some(player => player.id !== me && player.name.localeCompare(playerName, 'ar', { sensitivity: 'base' }) === 0)) {
        setJoinError('الاسم مستخدم داخل الغرفة. اختر اسمًا مختلفًا.');
        setNotice('');
        return;
      }
      setJoin({ code: clean, name: playerName });
      setRoom(snapshot);
      roomRef.current = snapshot;
      setNotice('');
      setMode('guest');
    } catch {
      setJoinError('تعذر التحقق من الغرفة الآن. جرّب مرة ثانية.');
      setNotice('');
    }
  };
  useEffect(() => {
    if (!room || (room.phase !== 'countdown' && room.phase !== 'playing')) return;
    const receiveEmbeddedAction = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data as { type?: string; action?: OnlineGameAction } | null;
      if (message?.type !== 'qaddha-online-action' || !message.action) return;
      const action = message.action;
      if (action.sourceId !== me || action.gameId !== room.gameId) return;
      const channel = channelRef.current;
      if (!channel) return;
      if (mode === 'host') {
        rememberGameAction(action);
        void channel.send({ type: 'broadcast', event: 'server-message', payload: { type: 'game-action', action } });
      } else if (mode === 'guest') {
        void channel.send({ type: 'broadcast', event: 'client-message', payload: { type: 'game-action', playerId: me, action } satisfies ClientMessage });
      }
    };
    window.addEventListener('message', receiveEmbeddedAction);
    return () => window.removeEventListener('message', receiveEmbeddedAction);
  }, [me, mode, room?.phase, room?.code, room?.gameId, rememberGameAction]);

  const send = (message: ClientMessage) => { const channel = channelRef.current; if (channel) void channel.send({ type: 'broadcast', event: 'client-message', payload: message }); };
  const localPlayer = room?.players.find(p => p.id === me);
  const connectedPlayers = room?.players.filter(p => p.connected) || [];
  const minimumPlayers = room?.gameId === 'secret' ? 3 : 2;
  const teamsRequired = room?.gameId !== 'secret';
  const teamsReady = !teamsRequired || (connectedPlayers.some(p => p.team === 0) && connectedPlayers.some(p => p.team === 1));
  const allReady = !!room && connectedPlayers.length >= minimumPlayers && teamsReady && connectedPlayers.every(p => p.host || p.ready);
  const copy = async () => { try { await navigator.clipboard.writeText(roomUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setNotice('انسخ الرابط من شريط المتصفح'); } };
  const copyCode = async () => { try { if (!room) return; await navigator.clipboard.writeText(room.code); setCopied(true); setNotice('تم نسخ كود الغرفة'); window.setTimeout(() => { setCopied(false); setNotice(''); }, 1600); } catch { setNotice(`كود الغرفة: ${room?.code || ''}`); } };
  const exitOnline = async () => {
    if (mode === 'host' && room && hostToken) {
      const channel = channelRef.current;
      if (channel) {
        void channel.send({ type: 'broadcast', event: 'server-message', payload: { type: 'room-error', reason: 'host-left', text: 'أغلق المضيف الغرفة.' } satisfies ServerError });
      }
      try {
        const client = await getAuthClient();
        await client.rpc('qaddha_guest_close_room', { p_code: room.code, p_host_token: hostToken });
      } catch { /* closing locally still continues */ }
      try {
        localStorage.removeItem(`${ROOM_KEY_PREFIX}${room.code}`);
        localStorage.removeItem(`${HOST_TOKEN_PREFIX}${room.code}`);
      } catch {/* optional */}
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('online');
    url.searchParams.delete('onlineHost');
    window.history.replaceState({}, '', url);
    onBack();
  };
  const share = async () => navigator.share ? navigator.share({ title: `غرفة قدّها ${room?.code}`, text: `ادخل غرفة قدّها بالكود ${room?.code}`, url: roomUrl }) : copy();
  const start = () => update(r => ({ ...r, phase: 'countdown', scores: [0, 0], round: 1, startedAt: Date.now() + 3500, roundEndsAt: Date.now() + 3500 + r.timerSeconds * 1000, pausedAt: null, answerRevealed: false, winner: null, gameActions: [], players: r.players.map(p => ({ ...p, gameLoadedId: undefined })) }));
  const lobby = () => update(r => ({ ...r, phase: 'lobby', scores: [0, 0], round: 1, startedAt: null, roundEndsAt: null, pausedAt: null, answerRevealed: false, winner: null, gameActions: [], players: r.players.map(p => ({ ...p, ready: p.host, gameLoadedId: undefined })) }));
  const next = () => update(r => r.round >= r.totalRounds ? { ...r, phase: 'results', winner: r.scores[0] === r.scores[1] ? null : r.scores[0] > r.scores[1] ? 0 : 1, roundEndsAt: null, pausedAt: null } : { ...r, round: r.round + 1, roundEndsAt: Date.now() + r.timerSeconds * 1000, pausedAt: null, answerRevealed: false });
  const pause = () => update(r => r.pausedAt ? { ...r, roundEndsAt: r.roundEndsAt ? r.roundEndsAt + Date.now() - r.pausedAt : null, pausedAt: null } : { ...r, pausedAt: Date.now() });
  const remove = (id: string) => { const channel = channelRef.current; if (channel) void channel.send({ type: 'broadcast', event: 'server-message', payload: { type: 'room-error', reason: 'removed', text: 'أزالك المضيف من الغرفة.', targetId: id } satisfies ServerError }); update(r => ({ ...r, players: r.players.filter(p => p.id !== id) })); };
  const resyncGame = () => update(r => ({ ...r, gameRevision: r.gameRevision + 1, players: r.players.map(p => ({ ...p, gameLoadedId: undefined })) }));
  useEffect(() => {
    if (mode !== 'host' || room?.phase !== 'countdown' || !room.startedAt) return;
    const launchDeadline = room.startedAt + 5000;
    const tryLaunch = () => {
      const current = roomRef.current;
      if (!current || current.phase !== 'countdown' || !current.startedAt) return;
      const activePlayers = current.players.filter(player => player.connected);
      const allLoaded = activePlayers.length >= 2 && activePlayers.every(player => player.gameLoadedId === current.gameId);
      if (Date.now() >= current.startedAt && (allLoaded || Date.now() >= launchDeadline)) {
        update(r => ({ ...r, phase: 'playing', roundEndsAt: Date.now() + r.timerSeconds * 1000 }));
      }
    };
    tryLaunch();
    const timer = window.setInterval(tryLaunch, 150);
    return () => window.clearInterval(timer);
  }, [mode, room?.phase, room?.startedAt, update]);

  if (mode === 'entry') return <section className="online-room online-entry" dir="rtl"><button className="quiet online-back" onClick={exitOnline}><ArrowRight/> الرئيسية</button><div className="online-entry-hero"><span><Wifi/></span><small>قدّها أونلاين · بدون حساب</small><h1>غرفة واحدة.<br/><em>والحماس عند الكل.</em></h1><p>أنشئ غرفة وخذ كود من 6 خانات، أو ادخل بكود صاحبك. التسجيل اختياري وما تحتاج حساب عشان تلعب.</p></div>{notice && <p className="online-notice" role="status">{notice}</p>}<div className="online-how-steps"><span><b>1</b>أنشئ غرفة</span><span><b>2</b>شارك الكود</span><span><b>3</b>يدخل أصحابك</span><span><b>4</b>ابدأ اللعب</span></div><div className="online-entry-actions"><article><Crown/><small>للمضيف</small><h2>إنشاء غرفة</h2><p>اضبط اللعبة والجولات والوقت والفرق من نفس اللوبي.</p><label><span>اسمك</span><input maxLength={18} value={hostName} onChange={e => setHostName(e.target.value)}/></label><button className="primary" disabled={creating || cleanName(hostName).length < 2} onClick={create}>{creating ? 'نجهز الغرفة…' : 'إنشاء غرفة وأخذ الكود'}</button></article><article><Link2/><small>للاعب</small><h2>الانضمام بكود</h2><p>اكتب الكود واسمك فقط، اختر فريقك واضغط جاهز.</p><button className="secondary" onClick={() => setMode('join')}>عندي كود غرفة</button></article></div><p className="online-guest-note">يمكن لشخصين أو مجموعة اللعب معًا. الحساب فقط لحفظ بياناتك لاحقًا، وليس شرطًا للدخول.</p></section>;
  if (mode === 'join') return <section className="online-room online-entry" dir="rtl"><JoinCard code={join.code || queryCode} error={joinError} onJoin={joinRoom} onBack={() => queryCode ? exitOnline() : setMode('entry')}/></section>;
  if (!room) return <section className="online-room online-wait" dir="rtl"><RefreshCw className="spin"/><h1>نربطك بالغرفة…</h1><p>{notice || 'إذا انقطع النت لحظة، بنرجعك لنفس الفريق والجولة تلقائيًا.'}</p><button className="quiet" onClick={() => setMode('join')}>تغيير الكود</button></section>;

  const selected = games.find(g => g.id === room.gameId) || games[0];
  const target = room.phase === 'countdown' ? room.startedAt : room.roundEndsAt;
  const seconds = target ? Math.max(0, Math.ceil((target - (room.pausedAt || now)) / 1000)) : 0;
  return <section className="online-room" dir="rtl"><Header room={room} connected={connected} host={mode === 'host'} onBack={exitOnline}/>{notice && <p className="online-notice" role="status">{notice}</p>}
    {room.phase === 'lobby' ? <div className="online-lobby-layout"><main className="online-lobby-main"><div className="online-code-card"><div><small>كود الغرفة</small><strong dir="ltr">{room.code}</strong><span>{room.players.filter(p => p.connected).length} من {room.maxPlayers} متصلين</span></div><div className="online-share-actions"><button onClick={copyCode}>{copied ? <Check/> : <Copy/>}{copied ? 'تم النسخ' : 'نسخ الكود'}</button><button onClick={copy}><Link2/> نسخ الرابط</button><button onClick={share}><Share2/> مشاركة</button></div></div>{teamsRequired ? <TeamBoard room={room} canRemove={mode === 'host'} onRemove={remove}/> : <IndividualBoard room={room} canRemove={mode === 'host'} onRemove={remove}/>} {mode === 'guest' && localPlayer && <div className="guest-controls">{teamsRequired && <><button className={localPlayer.team === 0 ? 'active' : ''} onClick={() => send({ type: 'team', playerId: me, team: 0 })}>{room.teamNames[0]}</button><button className={localPlayer.team === 1 ? 'active' : ''} onClick={() => send({ type: 'team', playerId: me, team: 1 })}>{room.teamNames[1]}</button></>}<button className={`ready ${localPlayer.ready ? 'active' : ''}`} onClick={() => send({ type: 'ready', playerId: me, ready: !localPlayer.ready })}>{localPlayer.ready ? <><Check/> جاهز</> : 'أعلن جاهزيتي'}</button></div>}{mode === 'host' && <div className="host-lobby-controls"><div className="host-settings-title"><Settings2/><div><b>إعداد المباراة</b><small>كل الخيارات في مكان واحد</small></div></div><label><span>اللعبة</span><select value={room.gameId} onChange={e => update(r => {
  const gameId = e.target.value;
  return { ...r, gameId, totalRounds: closestAllowed(r.totalRounds, roundOptionsForGame(gameId)), timerSeconds: closestAllowed(r.timerSeconds, timerOptionsForGame(gameId)), gameActions: [], players: r.players.map(p => ({ ...p, gameLoadedId: undefined })) };
})}>{games.map(g => <option value={g.id} key={g.id}>{g.title}</option>)}</select></label><label><span>عدد اللاعبين</span><select value={room.maxPlayers} onChange={e => update(r => ({ ...r, maxPlayers: Number(e.target.value) }))}>{[2,4,6,8,10,12].map(n => <option key={n} value={n} disabled={n < room.players.length}>{n} لاعبين</option>)}</select></label><label><span>{room.gameId === 'letters' ? 'نظام المباراة' : room.gameId === 'teams' ? 'عدد الأسئلة' : 'عدد الجولات'}</span><select value={room.totalRounds} onChange={e => update(r => ({ ...r, totalRounds: Number(e.target.value) }))}>{roundOptionsForGame(room.gameId).map(n => <option key={n} value={n}>{room.gameId === 'letters' ? (n===1?'جولة واحدة':`الأفضل من ${n}`) : n}</option>)}</select></label><label><span>{room.gameId === 'secret' ? 'وقت النقاش' : 'المؤقت'}</span><select value={room.timerSeconds} onChange={e => update(r => ({ ...r, timerSeconds: Number(e.target.value) }))}>{timerOptionsForGame(room.gameId).map(n => <option key={n} value={n}>{n >= 90 ? `${n/60} دقيقة` : `${n} ثانية`}</option>)}</select></label><label><span>الصعوبة</span><select value={room.difficulty} onChange={e => update(r => ({ ...r, difficulty: e.target.value as Difficulty }))}><option value="mixed">متنوعة</option><option value="easy">سهلة</option><option value="medium">متوسطة</option><option value="hard">صعبة</option></select></label><label><span>التصنيف</span><select value={room.category} onChange={e => update(r => ({ ...r, category: e.target.value }))}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>{teamsRequired && <><label><span>اسم الفريق الأول</span><input maxLength={16} value={room.teamNames[0]} onChange={e => update(r => ({ ...r, teamNames: [cleanName(e.target.value), r.teamNames[1]] }))}/></label><label><span>اسم الفريق الثاني</span><input maxLength={16} value={room.teamNames[1]} onChange={e => update(r => ({ ...r, teamNames: [r.teamNames[0], cleanName(e.target.value)] }))}/></label></>}{teamsRequired && <button className="quiet auto-balance" onClick={() => update(r => ({ ...r, players: r.players.map((p, i) => ({ ...p, team: i % 2 as 0 | 1 })) }))}><Shuffle/> موازنة الفرق</button>}<button className="primary start-online" disabled={!allReady || (teamsRequired && !room.teamNames.every(Boolean))} onClick={start}><Gamepad2/> {connectedPlayers.length < minimumPlayers ? `بانتظار ${minimumPlayers - connectedPlayers.length} لاعب${minimumPlayers - connectedPlayers.length > 1 ? 'ين' : ''}` : !teamsReady ? 'وزّع اللاعبين على الفريقين' : !connectedPlayers.every(p => p.host || p.ready) ? 'بانتظار الجاهزية' : `ابدأ ${selected?.title}`}</button></div>}</main><aside className="online-qr"><div>{qr ? <img src={qr} alt={`رمز دخول غرفة ${room.code}`}/> : <QrCode/>}</div><h3>دخول بالكاميرا</h3><p>امسح الرمز أو افتح الرابط، ثم اكتب اسمك واختر فريقك.</p><dl><div><dt>اللعبة</dt><dd>{selected?.title}</dd></div><div><dt>الجولات</dt><dd>{room.totalRounds}</dd></div><div><dt>الوقت</dt><dd>{room.timerSeconds}ث</dd></div><div><dt>التصنيف</dt><dd>{room.category}</dd></div></dl></aside></div> : <main className="online-live"><div className="online-game-banner"><small>{room.phase === 'countdown' ? 'اللعبة تبدأ الآن' : room.phase === 'results' ? 'انتهت المباراة' : `الجولة ${room.round} من ${room.totalRounds}`}</small><h2>{selected?.title}</h2><p>{room.phase === 'countdown' ? `نجهز اللعبة على كل الأجهزة… ${room.players.filter(p => p.connected && p.gameLoadedId === room.gameId).length}/${room.players.filter(p => p.connected).length}` : room.phase === 'results' ? 'النتيجة النهائية محفوظة داخل الغرفة.' : `${selected?.tag} · ${room.category}`}</p>{room.phase === 'countdown' && <strong className={`online-synced-timer ${seconds <= 5 ? 'urgent' : ''}`}>{seconds || 'الآن'}</strong>}{room.answerRevealed && <span className="answer-revealed"><Eye/> الإجابة مكشوفة</span>}</div>{(room.phase === 'countdown' || room.phase === 'playing') && <section className={`online-live-game ${room.phase === 'countdown' ? 'preloading' : ''}`} aria-hidden={room.phase === 'countdown'} aria-label={`اللعبة الحالية: ${selected?.title || room.gameId}`}><iframe id="qaddha-online-game-frame" key={`${room.code}:${room.gameId}:${room.startedAt || 0}:${room.gameRevision}`} src={`${window.location.pathname}?play=${encodeURIComponent(room.gameId)}&onlineEmbed=1&onlinePlayer=${encodeURIComponent(me)}&onlineSeed=${encodeURIComponent(`${room.code}:${room.gameId}:${room.startedAt || 0}`)}&onlineTeam0=${encodeURIComponent(room.teamNames[0])}&onlineTeam1=${encodeURIComponent(room.teamNames[1])}&onlineName=${encodeURIComponent(localPlayer?.name || '')}&onlineRoster=${encodeURIComponent(JSON.stringify(room.players.filter(p => p.connected).map(p => p.name)))}&onlineTimer=${encodeURIComponent(String(room.timerSeconds))}&onlineRounds=${encodeURIComponent(String(room.totalRounds))}&onlineCategory=${encodeURIComponent(room.category)}&onlineDifficulty=${encodeURIComponent(room.difficulty === 'mixed' ? 'medium' : room.difficulty)}`} title={selected?.title || 'لعبة قدّها'} allow="fullscreen" onLoad={() => {
  window.setTimeout(() => replayStoredActions(roomRef.current), 80);
  if (mode === 'host') update(r => ({ ...r, players: r.players.map(p => p.id === me ? { ...p, gameLoadedId: r.gameId } : p) }), false);
  else send({ type: 'game-loaded', playerId: me, gameId: room.gameId });
}} /></section>}<TeamBoard room={room} canRemove={mode === 'host'} onRemove={remove}/>{mode === 'guest' && room.phase === 'playing' && <div className="online-guest-live-tools"><button onClick={() => send({ type: 'resync-game', playerId: me })}><RefreshCw/> إعادة مزامنة اللعبة</button></div>}{mode === 'host' && room.phase === 'playing' && <div className="online-host-live-tools"><button onClick={resyncGame}><RefreshCw/> مزامنة اللعبة</button><button onClick={lobby}><RotateCcw/> العودة للوبي</button></div>}{mode === 'host' && room.phase === 'playing' && <div className="online-host-score">{([0, 1] as const).map(team => <section key={team}><span>{room.teamNames[team]}</span><button onClick={() => update(r => ({ ...r, scores: team === 0 ? [Math.max(0, r.scores[0] - 1), r.scores[1]] : [r.scores[0], Math.max(0, r.scores[1] - 1)] }))}><Minus/></button><strong>{room.scores[team]}</strong><button onClick={() => update(r => ({ ...r, scores: team === 0 ? [r.scores[0] + 1, r.scores[1]] : [r.scores[0], r.scores[1] + 1] }))}><Plus/></button></section>)}<div className="online-round-actions"><button onClick={pause}>{room.pausedAt ? <Play/> : <Pause/>}{room.pausedAt ? 'استئناف' : 'إيقاف مؤقت'}</button><button className={room.answerRevealed ? 'active' : ''} onClick={() => update(r => ({ ...r, answerRevealed: !r.answerRevealed }))}><Eye/>{room.answerRevealed ? 'إخفاء الإجابة' : 'كشف الإجابة'}</button><button onClick={resyncGame}><RefreshCw/> مزامنة اللعبة</button><button className="secondary" onClick={next}>{room.round >= room.totalRounds ? 'إنهاء المباراة' : 'الجولة التالية'}</button><button onClick={lobby}>العودة للوبي</button></div></div>}{room.phase === 'results' && <div className="online-results"><Trophy/><h2>{room.winner === null ? 'تعادل قوي!' : `${room.teamNames[room.winner]} فاز`}</h2>{mode === 'host' ? <div><button className="primary" onClick={start}><RotateCcw/> إعادة المباراة</button><button className="secondary" onClick={lobby}>لعبة أو إعدادات جديدة</button></div> : <p>المضيف يختار إعادة المباراة أو تغيير اللعبة.</p>}</div>}</main>}
  </section>;
}
