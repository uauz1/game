import { useEffect, useMemo, useRef, useState } from 'react';
import { Brain, Cast, Check, Clock3, Copy, Expand, Gamepad2, Monitor, Moon, RefreshCcw, Settings, Share2, ShieldCheck, Smartphone, Sun, Trophy, Type, Users, Vibrate, Volume2, X, Zap } from 'lucide-react';
import {
  PREFS_KEY,
  applyQaddhaPreferences,
  defaultQaddhaPrefs,
  readQaddhaPreferences,
  type QaddhaSitePrefs,
  type SessionVibePreference,
} from '../../utils/sitePreferences';

export { PREFS_KEY, defaultQaddhaPrefs, readQaddhaPreferences, useQaddhaPreferences } from '../../utils/sitePreferences';
export type { QaddhaSitePrefs } from '../../utils/sitePreferences';

export default function SiteSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = useState<QaddhaSitePrefs>(() => readQaddhaPreferences());
  const [notice, setNotice] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const accessibilitySettings = useMemo(() => [
    { key: 'largeText' as const, title: 'تكبير الخط', desc: 'يكبّر النصوص والأزرار المهمة قليلًا.', icon: Type },
    { key: 'reducedMotion' as const, title: 'تقليل الحركة', desc: 'يخفف الأنيميشن والحركات الانتقالية.', icon: Zap },
    { key: 'highContrast' as const, title: 'تباين أعلى', desc: 'يقوي الحدود والنصوص لتحسين الوضوح.', icon: Check },
    { key: 'compactMode' as const, title: 'عرض مضغوط', desc: 'يعرض محتوى أكثر على الشاشة في الأجهزة الكبيرة.', icon: Monitor },
  ], []);

  const experienceSettings = useMemo(() => [
    { key: 'soundEnabled' as const, title: 'المؤثرات الصوتية', desc: 'أصوات العدّ والتنبيه والنتائج عند دعم اللعبة لها.', icon: Volume2 },
    { key: 'haptics' as const, title: 'اهتزاز الجوال', desc: 'اهتزاز خفيف للتأكيد والتنبيهات على الأجهزة المدعومة.', icon: Vibrate },
    { key: 'confirmExit' as const, title: 'تأكيد قبل الخروج', desc: 'يحمي الجولة من الإغلاق أو الرجوع بالخطأ.', icon: ShieldCheck },
    { key: 'rememberProgress' as const, title: 'حفظ التقدم', desc: 'يحفظ الجلسات والبطولات محليًا لتكملها لاحقًا.', icon: RefreshCcw },
  ], []);

  useEffect(() => {
    applyQaddhaPreferences(prefs);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* Preferences remain active for this visit. */ }
    window.dispatchEvent(new CustomEvent('qaddha:preferences-changed'));
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
    setPrefs(readQaddhaPreferences());
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

  const siteUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href;

  const share = async () => {
    const canShare = typeof navigator.share === 'function';
    try {
      if (canShare) await navigator.share({ title: 'قدّها', text: 'خلّنا نتحدى في قدّها', url: siteUrl });
      else await navigator.clipboard.writeText(siteUrl);
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
      [
        'qaddha_question_history_v3',
        'qaddha_party_used_questions_v2',
        'qaddha_used_question_ids_v1',
        'qaddha.huroof.used-questions.v1',
        'qaddha.who-am-i.used-cards.v1',
        'qaddha.new-games.used.v1',
      ].forEach((key) => localStorage.removeItem(key));
      setNotice('تم تصفير سجل الأسئلة؛ الجولات القادمة تبدأ من جديد');
    } catch { setNotice('تعذّر تصفير سجل الأسئلة في هذا المتصفح'); }
  };

  const resetSession = () => {
    try {
      localStorage.removeItem('qaddha.smart-session.v3');
      localStorage.removeItem('qaddha.smart-session.v2');
      localStorage.removeItem('qaddha.last-game');
      setNotice('تم مسح الجلسة والبطولة المحفوظة');
    } catch { setNotice('تعذّر مسح بيانات الجلسة'); }
  };

  const resetSettings = () => {
    setPrefs(defaultQaddhaPrefs);
    setNotice('عادت إعدادات قدّها للوضع الافتراضي');
  };

  return <div className="settings-overlay" onMouseDown={(e)=>e.currentTarget===e.target&&onClose()}>
    <section className="settings-panel" role="dialog" aria-modal="true" aria-label="إعدادات قدّها">
      <div className="settings-head"><div><span><Settings size={18}/> مركز إعدادات قدّها</span><h2>خلّ الموقع يضبط نفسه على جمعتكم</h2></div><button ref={closeButtonRef} className="settings-close" aria-label="إغلاق الإعدادات" onClick={onClose}><X/></button></div>

      <div className="theme-setting">
        <div><b>مظهر قدّها</b><small>اختر الجو المناسب، أو خلّه يتبع إعداد جهازك.</small></div>
        <div className="theme-options" role="group" aria-label="اختيار مظهر الموقع">
          {themes.map(({ value, label, icon: Icon }) => <button key={value} aria-pressed={prefs.theme === value} onClick={() => setPrefs((current) => ({ ...current, theme: value }))}><Icon/><span>{label}</span></button>)}
        </div>
      </div>

      <div className="display-setting">
        <div><b>حجم وطريقة العرض</b><small>استخدم «تلفزيون» للشاشات الكبيرة، أو اتركها تلقائية.</small></div>
        <div className="display-options" role="group" aria-label="اختيار طريقة العرض">
          {displays.map(({ value, label, icon: Icon }) => <button key={value} aria-pressed={prefs.display === value} onClick={() => setPrefs((current) => ({ ...current, display: value }))}><Icon/><span>{label}</span></button>)}
        </div>
      </div>

      <div className="settings-section-title"><Gamepad2/><div><b>إعدادات اللعب الافتراضية</b><small>تطبق تلقائيًا عند إنشاء جلسة أو بطولة جديدة.</small></div></div>
      <div className="display-setting">
        <div><b>عدد اللاعبين الافتراضي</b><small>من 2 إلى 24 لاعبًا.</small></div>
        <div className="stepper" style={{maxWidth:220}}><button onClick={()=>setPrefs(p=>({...p,defaultPlayers:Math.max(2,p.defaultPlayers-1)}))}>−</button><strong>{prefs.defaultPlayers}</strong><button onClick={()=>setPrefs(p=>({...p,defaultPlayers:Math.min(24,p.defaultPlayers+1)}))}>+</button></div>
      </div>
      <div className="display-setting">
        <div><b>مدة الجلسة الافتراضية</b><small>قدّها يبني عدد الألعاب على الوقت.</small></div>
        <div className="display-options">{([30,45,60,90] as const).map(value=><button key={value} aria-pressed={prefs.defaultDuration===value} onClick={()=>setPrefs(p=>({...p,defaultDuration:value}))}><Clock3/><span>{value} دقيقة</span></button>)}</div>
      </div>
      <div className="display-setting">
        <div><b>نوع الجلسة الافتراضي</b><small>ابدأ مباشرة بجلسة عادية أو بطولة.</small></div>
        <div className="display-options"><button aria-pressed={prefs.defaultSessionMode==='smart'} onClick={()=>setPrefs(p=>({...p,defaultSessionMode:'smart'}))}><Brain/><span>جلسة ذكية</span></button><button aria-pressed={prefs.defaultSessionMode==='tournament'} onClick={()=>setPrefs(p=>({...p,defaultSessionMode:'tournament'}))}><Trophy/><span>بطولة</span></button></div>
      </div>
      <div className="display-setting">
        <div><b>جو الجلسة الافتراضي</b><small>يضبط ترتيب الألعاب المقترحة.</small></div>
        <div className="display-options">{([
          ['balanced','متوازنة'],['fast','حماس وسرعة'],['brain','ذكاء وتخمين'],['family','عائلية']
        ] as const).map(([value,label])=><button key={value} aria-pressed={prefs.defaultVibe===value} onClick={()=>setPrefs(p=>({...p,defaultVibe:value}))}><SparkIcon value={value}/><span>{label}</span></button>)}</div>
      </div>

      <div className="settings-section-title"><Brain/><div><b>ذكاء الأسئلة</b><small>غيّر مستوى الضغط ومنع التكرار بدون تعديل كل لعبة يدويًا.</small></div></div>
      <div className="display-setting">
        <div><b>حدة الأسئلة المختلطة</b><small>الافتراضي «تنافسي»: متوسط إلى صعب.</small></div>
        <div className="display-options">{([
          ['balanced','متوازن'],['competitive','تنافسي'],['hardcore','صعب جدًا']
        ] as const).map(([value,label])=><button key={value} aria-pressed={prefs.questionIntensity===value} onClick={()=>setPrefs(p=>({...p,questionIntensity:value}))}><Brain/><span>{label}</span></button>)}</div>
      </div>
      <div className="display-setting">
        <div><b>منع تكرار الأسئلة</b><small>كلما رفعته يتذكر قدّها أسئلة أكثر قبل إعادة استخدامها.</small></div>
        <div className="display-options">{([
          ['standard','عادي'],['strict','قوي'],['maximum','أقصى حماية']
        ] as const).map(([value,label])=><button key={value} aria-pressed={prefs.repeatProtection===value} onClick={()=>setPrefs(p=>({...p,repeatProtection:value}))}><ShieldCheck/><span>{label}</span></button>)}</div>
      </div>

      <div className="settings-section-title"><Type/><div><b>الوصول وتجربة الاستخدام</b><small>إعدادات العرض والحركة والتفاعل.</small></div></div>
      <div className="settings-options">{accessibilitySettings.map(({key,title,desc,icon:Icon})=><button key={key} className={`settings-toggle ${prefs[key]?'on':''}`} aria-pressed={prefs[key]} onClick={()=>setPrefs((p)=>({...p,[key]:!p[key]}))}><span className="settings-icon"><Icon/></span><span><b>{title}</b><small>{desc}</small></span><i>{prefs[key]?'مفعّل':'متوقف'}</i></button>)}</div>

      <div className="settings-section-title"><Gamepad2/><div><b>الصوت والحفظ والحماية</b><small>تحكم في سلوك الموقع أثناء اللعب.</small></div></div>
      <div className="settings-options">{experienceSettings.map(({key,title,desc,icon:Icon})=><button key={key} className={`settings-toggle ${prefs[key]?'on':''}`} aria-pressed={prefs[key]} onClick={()=>setPrefs((p)=>({...p,[key]:!p[key]}))}><span className="settings-icon"><Icon/></span><span><b>{title}</b><small>{desc}</small></span><i>{prefs[key]?'مفعّل':'متوقف'}</i></button>)}</div>

      <div className="settings-section-title"><Settings/><div><b>أدوات الموقع</b><small>مشاركة، شاشة كبيرة، وإدارة البيانات المحلية.</small></div></div>
      <div className="settings-tools"><button onClick={share}><Share2/><span><b>مشاركة قدّها</b><small>أرسل رابط الموقع للمجموعة</small></span></button><button onClick={fullscreen}><Expand/><span><b>ملء الشاشة</b><small>أفضل للتلفزيون والشاشة الكبيرة</small></span></button><button onClick={resetQuestions}><RefreshCcw/><span><b>تصفير سجل الأسئلة</b><small>يسمح بظهور الأسئلة القديمة من جديد</small></span></button><button onClick={resetSession}><RefreshCcw/><span><b>مسح الجلسة المحفوظة</b><small>يحذف البطولة وآخر لعبة محفوظة</small></span></button><button onClick={resetSettings}><RefreshCcw/><span><b>استعادة الإعدادات</b><small>يرجع كل الخيارات للوضع الافتراضي</small></span></button><button onClick={async()=>{try{await navigator.clipboard.writeText(location.origin);setNotice('تم نسخ الرابط')}catch{setNotice('تعذّر النسخ؛ انسخ الرابط من شريط المتصفح')}}}><Copy/><span><b>نسخ الرابط</b><small>نسخ سريع للحافظة</small></span></button></div>
      {notice&&<div className="settings-notice" role="status">{notice}</div>}
    </section>
  </div>;
}

function SparkIcon({ value }: { value: SessionVibePreference }) {
  if (value === 'fast') return <Zap/>;
  if (value === 'brain') return <Brain/>;
  if (value === 'family') return <Users/>;
  return <Gamepad2/>;
}
