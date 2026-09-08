import { useEffect, useMemo, useRef, useState } from 'react';
import { Cast, Check, Copy, Expand, Monitor, Moon, RefreshCcw, Settings, Share2, Smartphone, Sun, Type, Volume2, X, Zap } from 'lucide-react';

type ThemePreference = 'dark' | 'light' | 'system';
type DisplayPreference = 'auto' | 'mobile' | 'tv';

type Prefs = {
  theme: ThemePreference;
  display: DisplayPreference;
  largeText: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
};

const PREFS_KEY = 'qaddha_site_prefs_v1';
const defaults: Prefs = { theme: 'dark', display: 'auto', largeText: false, reducedMotion: false, highContrast: false, soundEnabled: true };

const isThemePreference = (value: unknown): value is ThemePreference => value === 'dark' || value === 'light' || value === 'system';
const isDisplayPreference = (value: unknown): value is DisplayPreference => value === 'auto' || value === 'mobile' || value === 'tv';

function readPrefs(): Prefs {
  try {
    const value = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return {
      ...defaults,
      ...value,
      theme: isThemePreference(value.theme) ? value.theme : defaults.theme,
      display: isDisplayPreference(value.display) ? value.display : defaults.display,
    };
  } catch {
    return defaults;
  }
}

function applyPrefs(prefs: Prefs) {
  const root = document.documentElement;
  const resolvedTheme = prefs.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : prefs.theme;
  root.dataset.themePreference = prefs.theme;
  root.dataset.theme = resolvedTheme;
  root.dataset.qaddhaDisplay = prefs.display;
  root.style.colorScheme = resolvedTheme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'light' ? '#F4F1E9' : '#0B1020');
  root.dataset.qaddhaText = prefs.largeText ? 'large' : 'normal';
  root.dataset.qaddhaMotion = prefs.reducedMotion ? 'reduced' : 'full';
  root.dataset.qaddhaContrast = prefs.highContrast ? 'high' : 'normal';
}

export function useQaddhaPreferences() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const sync = () => applyPrefs(readPrefs());
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
}

export default function SiteSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs());
  const [notice, setNotice] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const settings = useMemo(() => [
    { key: 'largeText' as const, title: 'تكبير الخط', desc: 'يكبّر النصوص والأزرار المهمة قليلًا.', icon: Type },
    { key: 'reducedMotion' as const, title: 'تقليل الحركة', desc: 'يخفف الأنيميشن والحركات الانتقالية.', icon: Zap },
    { key: 'highContrast' as const, title: 'تباين أعلى', desc: 'يقوي الحدود والنصوص لتحسين الوضوح.', icon: Check },
    { key: 'soundEnabled' as const, title: 'المؤثرات الصوتية', desc: 'أصوات العدّ والتنبيه والنتائج.', icon: Volume2 },
  ], []);

  useEffect(() => {
    applyPrefs(prefs);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* Preferences remain active for this visit. */ }
  }, [prefs]);

  const themes = [
    { value: 'dark' as const, label: 'داكن', icon: Moon },
    { value: 'light' as const, label: 'فاتح', icon: Sun },
    { value: 'system' as const, label: 'حسب الجهاز', icon: Monitor },
  ];
  const displays = [
    { value: 'auto' as const, label: 'تلقائي', icon: Monitor },
    { value: 'mobile' as const, label: 'جوال', icon: Smartphone },
    { value: 'tv' as const, label: 'تلفزيون', icon: Cast },
  ];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const share = async () => {
    const canShare = typeof navigator.share === 'function';
    try {
      if (canShare) await navigator.share({ title: 'قدّها', text: 'خلّنا نتحدى في قدّها', url: location.origin });
      else await navigator.clipboard.writeText(location.origin);
      setNotice(canShare ? 'تم فتح المشاركة' : 'تم نسخ رابط قدّها');
    } catch { setNotice('تعذّرت المشاركة؛ جرّب نسخ الرابط بدلًا منها'); }
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
      localStorage.removeItem('qaddha.huroof.used-questions.v1');
      localStorage.removeItem('qaddha.who-am-i.used-cards.v1');
      localStorage.removeItem('qaddha.new-games.used.v1');
      setNotice('تم تصفير سجل الأسئلة؛ الجولات القادمة تبدأ ببنك جديد');
    } catch { setNotice('تعذّر تصفير السجل في هذا المتصفح'); }
  };

  const resetSettings = () => {
    setPrefs(defaults);
    setNotice('عادت إعدادات العرض والصوت للوضع الافتراضي');
  };

  return <div className="settings-overlay" onMouseDown={(e)=>e.currentTarget===e.target&&onClose()}>
    <section className="settings-panel" role="dialog" aria-modal="true" aria-label="إعدادات قدّها">
      <div className="settings-head"><div><span><Settings size={18}/> إعدادات قدّها</span><h2>خلّ التجربة على مزاجكم</h2></div><button ref={closeButtonRef} className="settings-close" aria-label="إغلاق الإعدادات" onClick={onClose}><X/></button></div>
      <div className="theme-setting">
        <div><b>مظهر قدّها</b><small>اختر الجو المناسب، أو خلّه يتبع إعداد جهازك.</small></div>
        <div className="theme-options" role="group" aria-label="اختيار مظهر الموقع">
          {themes.map(({ value, label, icon: Icon }) => <button key={value} aria-pressed={prefs.theme === value} onClick={() => setPrefs((current) => ({ ...current, theme: value }))}><Icon/><span>{label}</span></button>)}
        </div>
      </div>
      <div className="display-setting">
        <div><b>حجم وطريقة العرض</b><small>اختر «تلفزيون» عند عكس شاشة الجوال، ثم لف الجوال بالعرض.</small></div>
        <div className="display-options" role="group" aria-label="اختيار طريقة العرض">
          {displays.map(({ value, label, icon: Icon }) => <button key={value} aria-pressed={prefs.display === value} onClick={() => setPrefs((current) => ({ ...current, display: value }))}><Icon/><span>{label}</span></button>)}
        </div>
      </div>
      <div className="settings-options">{settings.map(({key,title,desc,icon:Icon})=><button key={key} className={`settings-toggle ${prefs[key]?'on':''}`} aria-pressed={prefs[key]} onClick={()=>setPrefs((p)=>({...p,[key]:!p[key]}))}><span className="settings-icon"><Icon/></span><span><b>{title}</b><small>{desc}</small></span><i>{prefs[key]?'مفعّل':'متوقف'}</i></button>)}</div>
      <div className="settings-tools"><button onClick={share}><Share2/><span><b>مشاركة قدّها</b><small>أرسل رابط الموقع للمجموعة</small></span></button><button onClick={fullscreen}><Expand/><span><b>ملء الشاشة</b><small>أفضل للتلفزيون والشاشة الكبيرة</small></span></button><button onClick={resetQuestions}><RefreshCcw/><span><b>تصفير سجل الأسئلة</b><small>يسمح بظهور الأسئلة القديمة من جديد</small></span></button><button onClick={resetSettings}><RefreshCcw/><span><b>استعادة الإعدادات</b><small>العرض والصوت للوضع الافتراضي</small></span></button><button onClick={async()=>{try{await navigator.clipboard.writeText(location.origin);setNotice('تم نسخ الرابط')}catch{setNotice('تعذّر النسخ؛ انسخ الرابط من شريط المتصفح')}}}><Copy/><span><b>نسخ الرابط</b><small>نسخ سريع للحافظة</small></span></button></div>
      {notice&&<div className="settings-notice" role="status">{notice}</div>}
    </section>
  </div>;
}
