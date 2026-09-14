import { useEffect, useRef } from 'react';
import { BookOpen, Cast, Gamepad2, HelpCircle, History, MonitorSmartphone, QrCode, Settings, ShieldCheck, Trophy, UserRound, Users, WifiOff, X, Zap } from 'lucide-react';

export default function HelpCenter({ open, onClose, onPlay }: { open: boolean; onClose: () => void; onPlay: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [onClose, open]);
  if (!open) return null;

  return <div className="help-overlay" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <section className="help-center" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <header><div><span><HelpCircle/> مركز مساعدة قدّها</span><h2 id="help-title">كل اللي تحتاجه قبل تبدأ</h2><p>التشغيل السريع، البطولات، ملف اللاعب، الشاشة الكبيرة، المقدم، والحفظ — كلها من نفس الموقع.</p></div><button ref={closeRef} className="settings-close" aria-label="إغلاق المساعدة" onClick={onClose}><X/></button></header>
      <div className="help-steps"><article><b>١</b><Users/><h3>اجمعوا الفرق</h3><p>اختاروا لعبة مباشرة أو خلّوا مدير الجلسة يرتب لكم الخطة.</p></article><article><b>٢</b><MonitorSmartphone/><h3>اختاروا المقدم</h3><p>المقدم يدير الأسئلة والنقاط، والألعاب السرية تنقل المعلومات الخاصة للجوال بالـQR.</p></article><article><b>٣</b><Gamepad2/><h3>ابدأوا التحدي</h3><p>المفضلة، التقدم، البطولات، وإعدادات الموقع تبقى جاهزة حسب اختياراتكم.</p></article></div>
      <div className="help-details">
        <details open><summary><Zap/> أبي أبدأ بأسرع طريقة</summary><p>من الرئيسية استخدم <b>تشغيل سريع</b>: حماس سريع، فريق ضد فريق، تحدي ذكاء، جو عائلي، أو ترتيب جلسة كاملة. وإذا عندك لعبة سابقة يظهر لك خيار الرجوع لها بسرعة.</p></details>
        <details><summary><BookOpen/> كيف تختلف الألعاب؟</summary><p><b>قدّها فرق:</b> فئات ونقاط لفريقين. <b>حروف مع عزيز:</b> سيطروا على مسار الحروف. <b>من أنا؟</b> تلميحات وخطف. <b>تحدي العائلة:</b> إجابات مرتبة ومقدم. وباقي الألعاب لها قواعد قصيرة تظهر قبل البداية.</p></details>
        <details><summary><Trophy/> وش الفرق بين الجلسة والبطولة؟</summary><p><b>الجلسة الذكية</b> ترتب عدة ألعاب متنوعة حسب العدد والوقت والجو. <b>البطولة</b> تضيف فريقين ونقاطًا تراكمية ونتيجة نهائية، وتحفظ البطولات المكتملة في ملف اللاعب وتدخل في ترتيب الفرق.</p></details>
        <details><summary><History/> وين ألقى نتائجنا القديمة؟</summary><p>افتح <b>ملف اللاعب</b>. هناك تلقى آخر الألعاب، الإنجازات، المستوى، التحدي اليومي، سجل البطولات، وأفضل الفرق حسب عدد الانتصارات وفارق النقاط.</p></details>
        <details><summary><UserRound/> هل لازم أسجل دخول؟</summary><p>لا. تقدر تلعب كضيف بالكامل. الحساب اختياري، وملف اللاعب المحلي يستمر في حفظ المفضلة والتقدم على نفس المتصفح حتى بدون تسجيل.</p></details>
        <details><summary><Cast/> كيف ألعب على التلفزيون؟</summary><p>من الإعدادات اختر وضع <b>تلفزيون</b> ثم فعّل ملء الشاشة. إذا كنت تعكس شاشة الجوال، لف الجهاز بالعرض وخله للمقدم بينما الجمهور يشوف الشاشة الكبيرة.</p></details>
        <details><summary><QrCode/> متى يظهر QR؟</summary><p>الـQR يظهر فقط إذا فيه معلومة سرية أو تحكم يفيد من الجوال. <b>تحدي العائلة</b> يعطي المقدم لوحة تحكم خاصة، <b>بنك الكلمات</b> يخفي الكلمة والممنوعات في جوال الموصّف، <b>مثّلها</b> يخفي العبارة في جوال الممثل، <b>من أنا؟</b> يخلي الإجابة والتحكيم عند المقدم، و<b>الكلمة السرّية</b> توزّع الأدوار والتصويت على جوالات اللاعبين. الألعاب اللي ما تحتاج سرية ما نحط فيها QR بلا داعي.</p></details>
        <details><summary><WifiOff/> هل يشتغل لو النت ضعف أو انقطع؟</summary><p>قدّها يحفظ نسخة من واجهة الموقع والملفات التي استخدمتها على الجهاز. بعد أول زيارة ناجحة، أجزاء كبيرة من التجربة تقدر تفتح من الكاش عند ضعف الشبكة. أما إنشاء غرفة QR جديدة وربط الجوالات فيحتاج اتصالًا بالشبكة وقت الربط.</p></details>
        <details><summary><Settings/> وش أقدر أغير من الإعدادات؟</summary><p>المظهر، طريقة العرض، حجم الخط، الحركة، التباين، الصوت، الاهتزاز، عدد اللاعبين والوقت الافتراضي، نوع الجلسة، حدة الأسئلة، وقوة منع التكرار. تقدر أيضًا تمسح الجلسة أو تصفر سجل الأسئلة.</p></details>
        <details><summary><ShieldCheck/> وش ينحفظ على الجهاز؟</summary><p>في وضع الضيف نحفظ المفضلة، آخر الألعاب، إعدادات العرض، سجل منع تكرار الأسئلة، التحدي اليومي، سجل البطولات، والجلسة أو البطولة إذا اخترت حفظ التقدم. هذه بيانات محلية في المتصفح.</p></details>
        <details><summary><HelpCircle/> إذا علقت الجولة؟</summary><p>إذا لعبة QR فقدت الاتصال، ارجع لشاشة إعداد اللعبة وامسح الرمز من جديد. وباقي الألعاب تقدر ترجع للرئيسية أو تمسح الجلسة المحفوظة من الإعدادات عند الحاجة.</p></details>
      </div>
      <div className="help-actions"><button className="primary" onClick={() => { onPlay(); onClose(); }}>اختاروا لعبة</button><button className="quiet" onClick={onClose}>رجوع</button></div>
    </section>
  </div>;
}