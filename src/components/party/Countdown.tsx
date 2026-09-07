import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Timer } from 'lucide-react';

export default function Countdown({ seconds, stopped }: { seconds: number; stopped: boolean }) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const deadline = useRef(Date.now() + seconds * 1000);
  const remainingMs = useRef(seconds * 1000);
  useEffect(() => {
    if (stopped || paused) return;
    deadline.current = Date.now() + remainingMs.current;
    const tick = () => {
      remainingMs.current = Math.max(0, deadline.current - Date.now());
      setRemaining(Math.ceil(remainingMs.current / 1000));
    };
    const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [paused, stopped]);
  return <div className={`countdown ${remaining <= 5 ? 'urgent' : ''}`}>
    <div className="timer-dial" style={{ '--progress': `${remaining / seconds * 100}%` } as React.CSSProperties}>
      <div><Timer size={18}/><strong role="timer" aria-label="الوقت المتبقي">{remaining}</strong><small>ثانية</small></div>
    </div>
    <span role="status">{remaining === 0 ? 'انتهى الوقت · القرار للمقدم' : stopped ? 'تم كشف الإجابة' : paused ? 'المؤقت متوقف' : 'وقت التفكير'}</span>
    <button className="quiet" onClick={() => setPaused(p => !p)} disabled={stopped || remaining === 0} aria-label={paused ? 'استئناف المؤقت' : 'إيقاف المؤقت'}>{paused ? <Play size={16}/> : <Pause size={16}/>} {paused ? 'استئناف' : 'إيقاف مؤقت'}</button>
  </div>;
}
