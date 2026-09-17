import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Crown, Gamepad2, Radio, Search, ShieldCheck, Sparkles, Trophy, Users, Wifi, WifiOff, X } from 'lucide-react';
import { achievementsFor, levelProgress, readProgression, recordRoomJoined, type ProgressionState } from '../../utils/progression';
import { createPartyCode, createPublicLobbyPresenceChannel, isValidPartyCode, normalizePartyCode, removeRealtimeChannel } from '../../utils/qaddhaRealtime';
import { getTournamentStandings, readTournamentHistory } from '../../utils/tournamentHistory';
import { clearActiveHostRoom, readActiveHostRoom, saveActiveHostRoom } from '../../utils/multiplayerSession';

type Props = { onBack: () => void; onPlay: (gameId: string) => void; games: { id: string; title: string; tag: string }[] };
type RoomMember = { id: string; name: string; role: 'host' | 'guest'; joinedAt: number };
type RoomState = 'idle' | 'connecting' | 'connected' | 'error';

function guestName() {
  try {
    const saved = localStorage.getItem('qaddha.party-name.v1');
    if (saved?.trim()) return saved.trim().slice(0, 18);
  } catch {/* optional */}
  return `لاعب ${Math.floor(100 + Math.random() * 900)}`;
}

export default function PartyHub({ onBack, onPlay, games }: Props) {
  const [progress, setProgress] = useState<ProgressionState>(() => readProgression());
  const [name, setName] = useState(guestName);
  const [codeInput, setCodeInput] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomState, setRoomState] = useState<RoomState>('idle');
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [copied, setCopied] = useState(false);
  const [roomMessage, setRoomMessage] = useState('');
  const [isHost,setIsHost]=useState(false);
  const [gameQuery,setGameQuery]=useState('');
  const hostGraceTimer=useRef<number|undefined>(undefined);
  const channelRef = useRef<ReturnType<typeof createPublicLobbyPresenceChannel> | null>(null);
  const memberId = useRef(`m-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`);
  const progression = useMemo(() => levelProgress(progress.xp), [progress.xp]);
  const achievements = useMemo(() => achievementsFor(progress), [progress]);
  const unlocked = achievements.filter(item => item.unlocked).length;
  const history = useMemo(() => readTournamentHistory(), [progress.tournamentsFinished]);
  const standings = useMemo(() => getTournamentStandings(history).slice(0, 6), [history]);
  const visibleGames=useMemo(()=>{const q=gameQuery.trim();return q?games.filter(game=>`${game.title} ${game.tag}`.includes(q)):games;},[gameQuery,games]);

  useEffect(()=>{const params=new URLSearchParams(window.location.search);const invited=normalizePartyCode(params.get('room')||'');if(invited&&isValidPartyCode(invited)){const active=readActiveHostRoom();const resumeHost=active?.code===invited;setCodeInput(invited);void connect(invited,resumeHost);}},[]);

  useEffect(() => {
    const refresh = () => setProgress(readProgression());
    window.addEventListener('qaddha:progression-changed', refresh);
    return () => window.removeEventListener('qaddha:progression-changed', refresh);
  }, []);

  useEffect(() => () => {
    if(hostGraceTimer.current)window.clearTimeout(hostGraceTimer.current);
    if (channelRef.current) {
      void channelRef.current.untrack().catch(()=>undefined);
      void removeRealtimeChannel(channelRef.current);
    }
  }, []);

  const disconnect = async () => {
    if(hostGraceTimer.current){window.clearTimeout(hostGraceTimer.current);hostGraceTimer.current=undefined;}if (channelRef.current){await channelRef.current.untrack().catch(()=>undefined);await removeRealtimeChannel(channelRef.current);}
    channelRef.current = null;
    setRoomState('idle');
    setRoomCode('');
    setMembers([]);
    setRoomMessage('');
    if(isHost) clearActiveHostRoom();
    setIsHost(false);
    const url=new URL(window.location.href);url.searchParams.delete('room');window.history.replaceState({},'',url);
  };

  const connect = async (code: string, host = false) => {
    const normalized = normalizePartyCode(code);
    if (!isValidPartyCode(normalized)) {
      setRoomMessage('اكتب كود الغرفة المكوّن من 6 خانات.');
      return;
    }
    await disconnect();
    setRoomState('connecting');
    setRoomCode(normalized);
    setCodeInput(normalized);
    setRoomMessage('');
    setIsHost(host);
    const url=new URL(window.location.href);url.searchParams.set('hub','1');url.searchParams.set('room',normalized);window.history.replaceState({},'',url);
    try {
      const channel = createPublicLobbyPresenceChannel(normalized, memberId.current);
      channelRef.current = channel;
      const self: RoomMember = { id: memberId.current, name: name.trim() || 'ضيف', role: host ? 'host' : 'guest', joinedAt: Date.now() };
      const syncPresence = () => {
        const state = channel.presenceState<RoomMember>();
        const raw = Object.values(state).flat();
        const next: RoomMember[] = raw.filter(member =>
          Boolean(member) && typeof member.id === 'string' && typeof member.name === 'string'
        ).map(member=>({id:member.id,name:member.name,role:(member.role==='host'?'host':'guest') as RoomMember['role'],joinedAt:typeof member.joinedAt==='number'?member.joinedAt:Date.now()})).sort((a,b)=>a.joinedAt-b.joinedAt).slice(0,24);
        setMembers(next);
        const hostOnline=next.some(member=>member.role==='host');
        if(host||hostOnline){if(hostGraceTimer.current)window.clearTimeout(hostGraceTimer.current);hostGraceTimer.current=undefined;setRoomState('connected');if(!host)setRoomMessage('');}
        else if(!hostGraceTimer.current){hostGraceTimer.current=window.setTimeout(()=>{setRoomState('error');setRoomMessage('الغرفة غير موجودة أو المضيف غير متصل.');hostGraceTimer.current=undefined;},4500);}
      };
      channel
        .on('presence', { event: 'sync' }, syncPresence)
        .on('presence', { event: 'join' }, syncPresence)
        .on('presence', { event: 'leave' }, syncPresence)
        .on('broadcast', { event: 'game' }, ({ payload }) => {
          const incoming = payload as { gameId?: string } | null;
          if (incoming?.gameId && games.some(game => game.id === incoming.gameId)) {
            setRoomMessage(`المضيف اختار: ${games.find(game => game.id === incoming.gameId)?.title}`);
            if(!host) onPlay(incoming.gameId);
          }
        })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            if(host)setRoomState('connected');else setRoomState('connecting');
            void channel.track(self);
            recordRoomJoined();
            try { localStorage.setItem('qaddha.party-name.v1', self.name); } catch {/* optional */}

          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRoomState('error');
            setRoomMessage('تعذر الاتصال بالغرفة. جرّب مرة ثانية.');
          }
        });
    } catch {
      setRoomState('error');
      setRoomMessage('تعذر فتح الغرفة.');
    }
  };

  const createRoom = () => {const code=createPartyCode();saveActiveHostRoom(code);void connect(code,true);};
  const joinRoom = () => void connect(codeInput, false);
  const copyCode = async () => {
    if (!roomCode) return;
    try {
      const invite=new URL(window.location.href);invite.searchParams.set('hub','1');invite.searchParams.set('room',roomCode);await navigator.clipboard.writeText(invite.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {/* code remains visible */}
  };
  const launchForRoom = (gameId: string) => {
    if(roomState==='connected'&&!isHost){setRoomMessage('المضيف هو اللي يختار اللعبة للغرفة.');return;}
    const channel = channelRef.current;
    if (channel && roomState === 'connected') void channel.send({ type: 'broadcast', event: 'game', payload: { gameId } });
    if(isHost&&roomCode)saveActiveHostRoom(roomCode);
    onPlay(gameId);
  };

  return <section className="party-hub" dir="rtl">
    <div className="hub-top"><button className="quiet" onClick={onBack}><ArrowLeft/> الرئيسية</button><span><Sparkles/> مركز قدّها</span></div>
    <div className="hub-hero">
      <div><small>ملف الجلسة</small><h1>كل لعبكم.<br/><em>في مكان واحد.</em></h1><p>غرف أونلاين بالكود، مستوى XP، إنجازات، بطولات وترتيب فرق — بدون تعقيد.</p></div>
      <div className="level-orb"><span>LEVEL</span><strong>{progression.level}</strong><small>{progress.xp} XP</small></div>
    </div>

    <div className="hub-grid">
      <section className="hub-card hub-progress"><div className="hub-card-title"><Crown/><div><small>التقدم</small><h2>مستواك في قدّها</h2></div></div><div className="xp-track"><span style={{ width: `${progression.percent}%` }}/></div><p>{progression.current} من {progression.needed} XP للمستوى القادم</p><div className="hub-stats"><div><strong>{progress.gamesStarted}</strong><span>لعبة بدأت</span></div><div><strong>{progress.uniqueGames.length}</strong><span>ألعاب مختلفة</span></div><div><strong>{progress.tournamentsFinished}</strong><span>بطولات</span></div></div></section>

      <section className="hub-card hub-room"><div className="hub-card-title"><Radio/><div><small>ONLINE PARTY</small><h2>غرفة بكود</h2></div></div>{roomState==='connected'?<><div className="room-live"><Wifi/><span>{isHost?'أنت المضيف':'متصل بالغرفة'}</span><strong>{roomCode}</strong><button onClick={copyCode}>{copied?<Check/>:<Copy/>}</button></div><div className="room-members">{members.map(member=><span key={member.id}><i/>{member.name}{member.role==='host'?<b>مضيف</b>:null}</span>)}</div><p>{members.length} متصلين الآن</p><div className="room-actions"><button className="quiet" onClick={()=>void disconnect()}><X/> إغلاق الغرفة</button></div></>:<><label className="room-name">اسمك<input maxLength={18} value={name} onChange={event=>setName(event.target.value)}/></label><div className="room-join"><input aria-label="كود الغرفة" placeholder="ABC234" value={codeInput} onChange={event=>setCodeInput(normalizePartyCode(event.target.value))}/><button className="secondary" disabled={roomState==='connecting'} onClick={joinRoom}>{roomState==='connecting'?<WifiOff/>:<Users/>} دخول</button></div><button className="primary room-create" disabled={roomState==='connecting'} onClick={createRoom}><Sparkles/> أنشئ غرفة جديدة</button>{roomMessage&&<p className="hub-warning">{roomMessage}</p>}</>}</section>

      <section className="hub-card hub-achievements"><div className="hub-card-title"><ShieldCheck/><div><small>{unlocked}/{achievements.length}</small><h2>الإنجازات</h2></div></div><div className="achievement-list">{achievements.map(item=><div key={item.id} className={item.unlocked?'unlocked':''}><span>{item.unlocked?'✓':'◆'}</span><div><b>{item.title}</b><small>{item.description}</small></div></div>)}</div></section>

      <section className="hub-card hub-standings"><div className="hub-card-title"><Trophy/><div><small>سجل البطولات</small><h2>ترتيب الفرق</h2></div></div>{standings.length?<div className="standings-list">{standings.map((team,index)=><div key={team.team}><span>{index+1}</span><b>{team.team}</b><small>{team.wins} فوز</small><strong>{team.differential>0?'+':''}{team.differential}</strong></div>)}</div>:<div className="hub-empty"><Trophy/><p>أكمل أول بطولة وبيظهر ترتيب الفرق هنا.</p></div>}</section>
    </div>

    <section className="hub-play"><div><Gamepad2/><span><small>{roomState==='connected'?'شغّلها لكل الغرفة':'تشغيل سريع'}</small><h2>كل الـ18 لعبة</h2></span></div><label className="hub-game-search"><Search/><input value={gameQuery} onChange={event=>setGameQuery(event.target.value)} placeholder="ابحث عن لعبة…"/></label><div>{visibleGames.map(game=><button key={game.id} disabled={roomState==='connected'&&!isHost} onClick={()=>launchForRoom(game.id)}><b>{game.title}</b><small>{game.tag}</small></button>)}</div></section>
  </section>;
}
