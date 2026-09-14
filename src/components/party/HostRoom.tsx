import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Copy, Gamepad2, Link2, RefreshCw, Send, Smartphone, Users, Wifi, WifiOff, X } from 'lucide-react';
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

export type FamilyHostCommand =
  | { type: 'submit-answer'; answer: string }
  | { type: 'strike' }
  | { type: 'switch-team' }
  | { type: 'award-round' };

export type FamilyHostState = {
  type: 'family-state';
  phase: 'setup' | 'play' | 'result';
  round: number;
  totalRounds: number;
  question: string;
  answers: { answer: string; points: number; revealed: boolean }[];
  teams: { name: string; color: string; score: number }[];
  active: number;
  strikes: number;
  roundScore: number;
  timedOut: boolean;
  feedback: { kind: 'correct' | 'wrong' | 'info'; text: string } | null;
};

type RoomStatus = 'starting' | 'ready' | 'connecting' | 'connected' | 'disconnected' | 'error';

// eslint-disable-next-line react-refresh/only-export-components -- The transport hook and its paired UI share one lazy-loaded boundary.
export function useFamilyHostRoom(state: FamilyHostState, onCommand: (command: FamilyHostCommand) => void) {
  const [status, setStatus] = useState<RoomStatus>('starting');
  const [hostUrl, setHostUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const channelRef = useRef<ReturnType<typeof createRealtimeRoomChannel> | null>(null);
  const stateRef = useRef(state);
  const commandRef = useRef(onCommand);
  stateRef.current = state;
  commandRef.current = onCommand;

  useEffect(() => {
    const roomId = createRealtimeRoomId('family');
    const token = createRealtimeRoomToken();
    const nextUrl = buildRealtimeJoinUrl('family', roomId, token);
    setHostUrl(nextUrl);
    void createRealtimeJoinQr(nextUrl).then(setQrCode).catch(() => setStatus('error'));
    const channel = createRealtimeRoomChannel('family', roomId, token);
    channelRef.current = channel;
    channel
      .on('broadcast', { event: 'hello' }, () => {
        setStatus('connected');
        void channel.send({ type: 'broadcast', event: 'state', payload: stateRef.current });
      })
      .on('broadcast', { event: 'command' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return;
        const command = payload as Partial<FamilyHostCommand>;
        if (command.type === 'submit-answer' && typeof command.answer === 'string') commandRef.current({ type: 'submit-answer', answer: command.answer.slice(0,80) });
        else if (command.type === 'strike' || command.type === 'switch-team' || command.type === 'award-round') commandRef.current({ type: command.type });
      })
      .subscribe(nextStatus => {
        if (nextStatus === 'SUBSCRIBED') setStatus(current => current === 'connected' ? current : 'ready');
        else if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') setStatus('error');
        else if (nextStatus === 'CLOSED') setStatus('disconnected');
      });
    return () => { channelRef.current = null; void removeRealtimeChannel(channel); };
  }, []);

  useEffect(() => {
    const channel = channelRef.current;
    if (channel && status === 'connected') void channel.send({ type:'broadcast', event:'state', payload:state });
  }, [state, status]);

  return { status, hostUrl, qrCode };
}

export function HostPairingPanel({ status, hostUrl, qrCode, compact = false }: { status: RoomStatus; hostUrl: string; qrCode: string; compact?: boolean; }) {
  const [copied, setCopied] = useState(false);
  const connected = status === 'connected';
  const copy = async () => { if (!hostUrl) return; try { await navigator.clipboard?.writeText(hostUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* QR scanning remains available. */ } };
  if (compact) return <div className={`host-link-compact ${connected ? 'connected' : ''}`}>{connected ? <Wifi/> : <WifiOff/>}<div><b>{connected ? 'جوال المقدم متصل' : 'جوال المقدم غير متصل'}</b><small>{connected ? 'التحكم والمطابقة يعملان الآن' : 'ارجع للإعدادات لإظهار رمز QR من جديد'}</small></div></div>;
  return <section className="host-pairing" aria-live="polite"><div className="host-pairing-copy"><span><Smartphone/> لوحة المقدم</span><h3>امسح الرمز بالجوال</h3><p>يفتح للمقدم السؤال والإجابات السرية وحقل المطابقة. الاتصال يمر عبر خادم قدّها بدل الاتصال المباشر بين الجهازين.</p><div className={`host-connection ${connected ? 'connected' : ''}`}>{connected ? <Wifi/> : <RefreshCw className={status === 'starting' || status === 'connecting' || status === 'ready' ? 'spin' : ''}/>}<b>{connected ? 'تم اتصال المقدم' : status === 'error' ? 'تعذر الاتصال بالخادم' : status === 'disconnected' ? 'انقطع الاتصال · افتح الرمز مجددًا' : 'بانتظار اتصال المقدم'}</b></div><button className="quiet host-copy" aria-label={hostUrl ? `نسخ رابط المقدم ${hostUrl}` : 'نسخ رابط المقدم'} disabled={!hostUrl} onClick={copy}>{copied ? <Check/> : <Copy/>}{copied ? 'تم نسخ الرابط' : 'نسخ رابط المقدم'}</button></div><div className="host-qr">{qrCode ? <img src={qrCode} alt="رمز QR لفتح لوحة مقدم تحدي العائلة"/> : <div className="qr-loading"><RefreshCw className="spin"/><span>نجهز الغرفة…</span></div>}</div></section>;
}

export function FamilyHostController({ roomId, token }: { roomId: string; token: string }) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [game, setGame] = useState<FamilyHostState | null>(null);
  const [answer, setAnswer] = useState('');
  const channelRef = useRef<ReturnType<typeof createRealtimeRoomChannel> | null>(null);

  useEffect(() => {
    if (!isValidRealtimeRoomId(roomId, 'family') || !isValidRealtimeRoomToken(token)) { setStatus('error'); return; }
    const channel = createRealtimeRoomChannel('family', roomId, token);
    channelRef.current = channel;
    channel.on('broadcast', { event:'state' }, ({ payload }) => {
      if (payload && typeof payload === 'object' && (payload as FamilyHostState).type === 'family-state') { setGame(payload as FamilyHostState); setStatus('connected'); }
    }).subscribe(nextStatus => {
      if (nextStatus === 'SUBSCRIBED') { setStatus('connected'); void channel.send({ type:'broadcast', event:'hello', payload:{at:Date.now()} }); }
      else if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') setStatus('error');
      else if (nextStatus === 'CLOSED') setStatus('disconnected');
    });
    return () => { channelRef.current = null; void removeRealtimeChannel(channel); };
  }, [roomId, token]);

  useEffect(() => setAnswer(''), [game?.round, game?.question]);
  const send = (command: FamilyHostCommand) => { const channel = channelRef.current; if (channel && status === 'connected') void channel.send({ type:'broadcast', event:'command', payload:command }); };
  const submit = (event: FormEvent) => { event.preventDefault(); const value = answer.trim(); if (!value) return; send({ type: 'submit-answer', answer: value }); setAnswer(''); };

  return <main className="mobile-host" dir="rtl"><header><span className="host-brand"><Gamepad2/> قدّها</span><span className={`mobile-host-status ${status}`}>{status === 'connected' ? <Wifi/> : <WifiOff/>}{status === 'connected' ? 'متصل بالشاشة' : status === 'error' ? 'تعذر الاتصال' : 'جاري الاتصال…'}</span></header>
    {!game ? <section className="host-wait"><Link2/><h1>{status === 'error' ? 'تعذر فتح غرفة المقدم' : 'نربطك بشاشة اللعب…'}</h1><p>{status === 'error' ? 'اطلب من شاشة اللعبة إنشاء رمز جديد ثم امسحه مرة أخرى.' : 'خلّ هذه الصفحة مفتوحة، وستظهر أدوات الجولة فور الاتصال.'}</p></section>
    : game.phase === 'setup' ? <section className="host-wait"><Smartphone/><h1>تم الربط بنجاح</h1><p>ابدأ الجولة من الشاشة الكبيرة، وستظهر هنا الإجابات وأدوات التحكم.</p></section>
    : game.phase === 'result' ? <section className="host-wait"><Check/><h1>اكتملت المباراة</h1><p>النتيجة النهائية ظاهرة الآن على الشاشة الكبيرة.</p></section>
    : <><section className="host-round-head"><small>الجولة {game.round + 1} من {game.totalRounds}</small><h1>{game.question}</h1><div className="host-team-turn" style={{ '--team': game.teams[game.active]?.color } as React.CSSProperties}><Users/><span>الدور: <b>{game.teams[game.active]?.name}</b></span><strong>{game.roundScore} نقطة</strong></div></section><form className="host-answer-form" onSubmit={submit}><label htmlFor="host-answer">اكتب إجابة الفريق</label><div><input id="host-answer" autoComplete="off" enterKeyHint="send" maxLength={80} value={answer} onChange={event => setAnswer(event.target.value)} placeholder="مثال: المنبه" disabled={game.timedOut}/><button type="submit" disabled={!answer.trim() || game.timedOut}><Send/> تحقق</button></div><small>إذا كانت ضمن اللوحة ستُكشف تلقائيًا، وإلا تُحسب ضربة.</small></form>{game.feedback ? <p className={`host-feedback ${game.feedback.kind}`} role="status">{game.feedback.kind === 'correct' ? <Check/> : game.feedback.kind === 'wrong' ? <X/> : <Link2/>}{game.feedback.text}</p> : null}<section className="host-secret-board"><div><span>خاص بالمقدم</span><b>{game.answers.filter(item => item.revealed).length} / {game.answers.length} مكشوفة</b></div>{game.answers.map((item, index) => <article className={item.revealed ? 'revealed' : ''} key={item.answer}><span>{index + 1}</span><b>{item.answer}</b><strong>{item.points}</strong></article>)}</section><div className="host-strikes"><span>الضربات</span><div>{[0, 1, 2].map(index => <i className={index < game.strikes ? 'on' : ''} key={index}>✕</i>)}</div></div><div className="host-mobile-actions"><button disabled={game.timedOut || game.strikes >= 3} onClick={() => send({ type: 'strike' })}><X/> ضربة</button><button disabled={game.timedOut} onClick={() => send({ type: 'switch-team' })}><Users/> تحويل الدور</button><button className="primary" disabled={!game.roundScore && !game.timedOut} onClick={() => send({ type: 'award-round' })}>إنهاء الجولة</button></div></>}
  </main>;
}
