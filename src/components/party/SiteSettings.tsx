import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Expand, RefreshCcw, Settings, Share2, Type, X, Zap } from 'lucide-react';

type Prefs = {
  largeText: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
};

const PREFS_KEY = 'qaddha_site_prefs_v1';
const defaults: Prefs = { largeText: false, reducedMotion: false, highContrast: false };

function readPrefs(): Prefs {
  try {
    const value = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return { ...defaults, ...value };
  } catch {
    return defaults;
  }
}

function applyPrefs(prefs: Prefs) {
  const root = document.documentElement;
  root.dataset.qaddhaText = prefs.largeText ? 'large' : 'normal';
  root.dataset.qaddhaMotion = prefs.reducedMotion ? 'reduced' : 'full';
  root.dataset.qaddhaContrast = prefs.highContrast ? 'high' : 'normal';
}

export function useQaddhaPreferences() {
  useEffect(() => applyPrefs(readPrefs()), []);
}

export default function SiteSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs());
  const [notice, setNotice] = useState('');
  const settings = useMemo(() => [
    { key: 'largeText' as const, title: 'تكبير الخط', desc: 'يكبّر النصوص والأزرار المهمة قليلًا.', icon: Type },
    { key: 'reducedMotion' as const, title: 'تقليل الحركة', desc: 'يخفف الأنيميشن والحركات الانتقالية.', icon: Zap },
    { key: 'highContrast' as const, title: 'تباين أعلى', desc: 'يقوي الحدود والنصوص لتحسين الوضوح.', icon: Check },
  ], []);

  useEffect(() => {
    applyPrefs(prefs);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'قدّها', text: 'خلّنا نتحدى في قدّها', url: location.origin });
      else await navigator.clipboard.writeText(location.origin);
      setNotice(navigator.share ? 'تم فتح المشاركة' : 'تم نسخ رابط قدّها');
    } catch {}
  };

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setNotice(document.fullscreenElement ? 'تم تشغيل ملء الشاشة' : 'تم تحديث وضع الشاشة');
    } catch { setNotice('ملء الشاشة غير مدعوم في هذا المتصفح'); }
  };

  const resetQuestions = () => {
    try {
      localStorage.removeItem('qaddha_party_used_questions_v2');
      localStorage.removeItem('qaddha_used_question_ids_v1');
      setNotice('تم تصفير سجل الأسئلة؛ الجولات القادمة تبدأ ببنك جديد');
    } catch {}
  };

  return <div className="settings-overlay" onMouseDown={(e)=>e.currentTarget===e.target&&onClose()}>
    <section className="settings-panel" role="dialog" aria-modal="true" aria-label="إعدادات قدّها">
      <div className="settings-head"><div><span><Settings size={18}/> إعدادات قدّها</span><h2>خلّ التجربة على مزاجكم</h2></div><button className="settings-close" aria-label="إغلاق الإعدادات" onClick={onClose}><X/></button></div>
      <div className="settings-options">{settings.map(({key,title,desc,icon:Icon})=><button key={key} className={`settings-toggle ${prefs[key]?'on':''}`} aria-pressed={prefs[key]} onClick={()=>setPrefs((p)=>({...p,[key]:!p[key]}))}><span className="settings-icon"><Icon/></span><span><b>{title}</b><small>{desc}</small></span><i>{prefs[key]?'مفعّل':'متوقف'}</i></button>)}</div>
      <div className="settings-tools"><button onClick={share}><Share2/><span><b>مشاركة قدّها</b><small>أرسل رابط الموقع للمجموعة</small></span></button><button onClick={fullscreen}><Expand/><span><b>ملء الشاشة</b><small>أفضل للتلفزيون والشاشة الكبيرة</small></span></button><button onClick={resetQuestions}><RefreshCcw/><span><b>تصفير سجل الأسئلة</b><small>يسمح بظهور الأسئلة القديمة من جديد</small></span></button><button onClick={async()=>{try{await navigator.clipboard.writeText(location.origin);setNotice('تم نسخ الرابط')}catch{}}}><Copy/><span><b>نسخ الرابط</b><small>نسخ سريع للحافظة</small></span></button></div>
      {notice&&<div className="settings-notice" role="status">{notice}</div>}
    </section>
  </div>;
}
