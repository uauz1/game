import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Home, RotateCcw, Smartphone, Tv, Wifi, WifiOff } from 'lucide-react';
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

type Command = 'left' | 'right' | 'up' | 'down' | 'select' | 'back' | 'home';
type RoomStatus = 'starting' | 'ready' | 'connected' | 'error' | 'disconnected';

const SELECTOR = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function visibleElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter((el) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 2 && rect.height > 2;
  });
}

function center(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function moveFocus(command: Exclude<Command, 'select' | 'back' | 'home'>) {
  const items = visibleElements();
  if (!items.length) return;
  const current = document.activeElement instanceof HTMLElement && items.includes(document.activeElement) ? document.activeElement : null;
  if (!current) {
    items[0].focus({ preventScroll: false });
    items[0].scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    return;
  }
  const from = center(current);
  const candidates = items.filter((item) => item !== current).map((item) => {
    const to = center(item);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const valid = command === 'left' ? dx < -8 : command === 'right' ? dx > 8 : command === 'up' ? dy < -8 : dy > 8;
    const primary = command === 'left' || command === 'right' ? Math.abs(dx) : Math.abs(dy);
    const secondary = command === 'left' || command === 'right' ? Math.abs(dy) : Math.abs(dx);
    return { item, valid, score: primary + secondary * 2.2 };
  }).filter((entry) => entry.valid).sort((a, b) => a.score - b.score);
  const next = candidates[0]?.item;
  if (!next) return;
  next.focus({ preventScroll: false });
  next.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
}

function execute(command: Command) {
  if (command === 'select') {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body && active.matches(SELECTOR)) active.click();
    else visibleElements()[0]?.click();
    return;
  }
  if (command === 'home') {
    (document.querySelector('.brand') as HTMLElement | null)?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (command === 'back') {
    const candidates = visibleElements();
    const back = candidates.find((el) => /الرئيسية|الألعاب|رجوع|عودة|إنهاء/.test((el.textContent || '').trim()));
    if (back) back.click();
    else (document.querySelector('.brand') as HTMLElement | null)?.click();
    return;
  }
  moveFocus(command);
}

export function TVRemoteBridge({ children }: { children: ReactNode }) {
  const direct = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('tv') === '1' || p.get('tv') === 'true' || p.get('display') === 'tv';
  }, []);
  const [status, setStatus] = useState<RoomStatus>('starting');
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!direct) return;
    const roomId = createRealtimeRoomId('tv');
    const token = createRealtimeRoomToken();
    const url = buildRealtimeJoinUrl('tv', roomId, token);
    setCode(roomId.slice(-6).toUpperCase());
    void createRealtimeJoinQr(url).then(setQr).catch(() => setStatus('error'));
    const channel = createRealtimeRoomChannel('tv', roomId, token);
    channel
      .on('broadcast', { event: 'hello' }, () => setStatus('connected'))
      .on('broadcast', { event: 'command' }, ({ payload }) => {
        const cmd = (payload as { command?: Command } | null)?.command;
        if (cmd && ['left','right','up','down','select','back','home'].includes(cmd)) execute(cmd);
      })
      .subscribe((next) => {
        if (next === 'SUBSCRIBED') setStatus((s) => s === 'connected' ? s : 'ready');
        else if (next === 'CHANNEL_ERROR' || next === 'TIMED_OUT') setStatus('error');
        else if (next === 'CLOSED') setStatus('disconnected');
      });
    return () => { void removeRealtimeChannel(channel); };
  }, [direct]);

  return <>{children}{direct && <aside dir="rtl" style={{position:'fixed',left:18,bottom:18,zIndex:130,width:status==='connected'?240:300,padding:status==='connected'?'10px 14px':'14px',border:'1px solid rgba(215,169,59,.35)',borderRadius:20,background:'rgba(7,7,7,.94)',boxShadow:'0 18px 55px #0009',color:'#fff',backdropFilter:'blur(16px)'}}>
    {status === 'connected' ? <div style={{display:'flex',alignItems:'center',gap:10}}><Wifi size={18} color="#f3c95a"/><div><b style={{display:'block'}}>الريموت متصل</b><small style={{color:'#aaa'}}>تحكم من الجوال</small></div></div> : <div style={{display:'grid',gridTemplateColumns:'1fr 112px',gap:12,alignItems:'center'}}><div><div style={{display:'flex',alignItems:'center',gap:8,color:'#f3c95a',fontWeight:900}}><Tv size={18}/> وضع التلفزيون</div><p style={{fontSize:12,lineHeight:1.6,color:'#bbb',margin:'8px 0'}}>امسح QR بالجوال. التلفزيون يبقى بدقته الأصلية والجوال يصير ريموت.</p><b style={{fontSize:12}}>رمز {code || '------'}</b><div style={{display:'flex',gap:6,alignItems:'center',marginTop:7,fontSize:11,color:'#999'}}>{status==='error'?<WifiOff size={14}/>:<Wifi size={14}/>} {status==='error'?'تعذر الاتصال':'بانتظار الجوال'}</div></div>{qr?<img src={qr} alt="QR ريموت قدّها" style={{width:112,height:112,borderRadius:10,background:'#fff',padding:4}}/>:<div style={{width:112,height:112,borderRadius:10,background:'#111'}}/>}</div>}
  </aside>}</>;
}

export function TVRemotePhone({ roomId, token }: { roomId: string; token: string }) {
  const valid = isValidRealtimeRoomId(roomId, 'tv') && isValidRealtimeRoomToken(token);
  const [status, setStatus] = useState<RoomStatus>(valid ? 'starting' : 'error');
  const channelRef = useRef<ReturnType<typeof createRealtimeRoomChannel> | null>(null);

  useEffect(() => {
    if (!valid) return;
    const channel = createRealtimeRoomChannel('tv', roomId, token);
    channelRef.current = channel;
    channel.subscribe((next) => {
      if (next === 'SUBSCRIBED') {
        setStatus('connected');
        void channel.send({ type:'broadcast', event:'hello', payload:{ at:Date.now() } });
      } else if (next === 'CHANNEL_ERROR' || next === 'TIMED_OUT') setStatus('error');
      else if (next === 'CLOSED') setStatus('disconnected');
    });
    return () => { channelRef.current = null; void removeRealtimeChannel(channel); };
  }, [roomId, token, valid]);

  const send = (command: Command) => {
    if (status !== 'connected' || !channelRef.current) return;
    if ('vibrate' in navigator) navigator.vibrate(14);
    void channelRef.current.send({ type:'broadcast', event:'command', payload:{ command } });
  };
  const btn = (label:string, command:Command, icon:ReactNode, gridColumn?:string) => <button onClick={()=>send(command)} disabled={status!=='connected'} aria-label={label} style={{gridColumn,height:72,borderRadius:22,border:'1px solid rgba(255,255,255,.12)',background:'#141414',color:'#fff',display:'grid',placeItems:'center',fontSize:16,fontWeight:900,boxShadow:'inset 0 0 0 1px #000'}}>{icon}<span style={{fontSize:11,color:'#aaa'}}>{label}</span></button>;

  return <main dir="rtl" style={{minHeight:'100dvh',background:'radial-gradient(circle at 50% 0,#2b210d 0,#090909 42%,#050505 100%)',color:'#fff',padding:'24px 18px',fontFamily:'system-ui, sans-serif',display:'grid',placeItems:'center'}}><section style={{width:'min(100%,430px)'}}><div style={{textAlign:'center',marginBottom:22}}><div style={{width:62,height:62,borderRadius:20,display:'grid',placeItems:'center',margin:'0 auto 12px',border:'1px solid #d7a93b66',background:'#15110a'}}><Smartphone color="#f3c95a"/></div><h1 style={{margin:0,fontSize:28}}>ريموت قدّها</h1><p style={{margin:'8px 0',color:'#aaa'}}>{status==='connected'?'متصل بالتلفزيون · جاهز':'جاري الاتصال بالتلفزيون…'}</p></div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
    <div/>{btn('فوق','up',<ArrowUp/>)}<div/>
    {btn('يمين','right',<ArrowRight/>)}{btn('اختيار','select',<Check color="#f3c95a"/>)}{btn('يسار','left',<ArrowLeft/>)}
    <div/>{btn('تحت','down',<ArrowDown/>)}<div/>
    {btn('الرئيسية','home',<Home/>, 'span 2')}{btn('رجوع','back',<RotateCcw/>)}
  </div>
  <p style={{textAlign:'center',fontSize:12,color:'#777',lineHeight:1.7,marginTop:18}}>خلّ التلفزيون على صفحة قدّها. استخدم الأسهم لتحديد العنصر، ثم اضغط اختيار.</p></section></main>;
}
