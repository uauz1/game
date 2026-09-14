import { useEffect, useRef } from 'react';
import { BookOpen, Cast, Gamepad2, HelpCircle, MonitorSmartphone, QrCode, Settings, ShieldCheck, Trophy, Users, X } from 'lucide-react';

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
      <header><div><span><HelpCircle/> مركز مساعدة قدّها</span><h2 id="help-title">كل اللي تحتاجه قبل تبدأ</h2><p>اللعب السريع، البطولات، الشاشة الكبيرة، المقدم، والإعدادات — كلها من نفس الموقع.</p></div><button ref={closeRef} className="settings-close" aria-label="إغلاق المساعدة" onClick={onClose}><X/></button></header>
      <div className="help-steps"><article><b>١</b><Users/><h3>اجمعوا الفرق</h3><p>اختاروا لعبة مباشرة أو خلّوا مدير الجلسة يرتب لكم الخطة.</p></article><article><b>٢</b><MonitorSmartphone/><h3>اختاروا المقدم</h3><p>المقدم يدير الأسئلة والنقاط. بعض الألعاب تدعم جوالًا ثانيًا بالـQR.</p></article><article><b>٣</b><Gamepad2/><h3>ابدأوا التحدي</h3><p>المفضلة، التقدم، وإعدادات الموقع تبقى جاهزة حسب اختياراتكم.</p></article></div>
      <div className="help-details">
        <details open><summary><BookOpen/> كيف تختلف الألعاب؟</summary><p><b>قدّها فرق:</b> فئات ونقاط لفريقين. <b>حروف مع عزيز:</b> سيطروا على مسار الحروف. <b>من أنا؟</b> تلميحات وخطف. <b>تحدي العائلة:</b> إجابات مرتبة ومقدم. وباقي الألعاب لها قواعد قصيرة تظهر قبل البداية.</p></details>
        <details><summary><Trophy/> وش الفرق بين الجلسة والبطولة؟</summary><p><b>الجلسة الذكية</b> ترتب عدة ألعاب متنوعة حسب العدد والوقت والجو. <b>البطولة</b> تضيف فريقين ونقاطًا تراكمية ونتيجة نهائية، وتقدر تكملها لاحقًا إذا كان حفظ التقدم مفعّلًا.</p></details>
        <details><summary><Cast/> كيف ألعب على التلفزيون؟</summary><p>من الإعدادات اختر وضع <b>تلفزيون</b> ثم فعّل ملء الشاشة. إذا كنت تعكس شاشة الجوال، لف الجهاز بالعرض وخله للمقدم بينما الجمهور يشوف الشاشة الكبيرة.</p></details>
        <details><summary><QrCode/> متى يظهر QR؟</summary><p>الـQR يستخدم فقط في الألعاب التي تستفيد فعلًا من جهاز مقدم منفصل. <b>تحدي العائلة</b> يدعم هذا التدفق حاليًا، والتصميم مبني بحيث يمكن توسيعه لباقي ألعاب المقدم بدون تكرار النظام.</p></details>
        <details><summary><Settings/> وش أقدر أغير من الإعدادات؟</summary><p>المظهر، طريقة العرض، حجم الخط، الحركة، التباين، الصوت، الاهتزاز، عدد اللاعبين والوقت الافتراضي، نوع الجلسة، حدة الأسئلة، وقوة منع التكرار. تقدر أيضًا تمسح الجلسة أو تصفر سجل الأسئلة.</p></details>
        <details><summary><ShieldCheck/> وش ينحفظ على الجهاز؟</summary><p>في وضع الضيف نحفظ المفضلة، آخر الألعاب، إعدادات العرض، سجل منع تكرار الأسئلة، والجلسة أو البطولة إذا اخترت حفظ التقدم. هذه بيانات محلية في المتصفح، والحساب يبقى اختياريًا عندما تكون خدمة الدخول مفعّلة.</p></details>
        <details><summary><HelpCircle/> إذا علقت الجولة؟</summary><p>ارجع للرئيسية من شعار قدّها، أو افتح الإعدادات وامسح الجلسة المحفوظة أو صفّر سجل الأسئلة عند الحاجة. قبل أي تغيير كبير جرّب إعادة فتح اللعبة من آخر الألعاب.</p></details>
      </div>
      <div className="help-actions"><button className="primary" onClick={() => { onPlay(); onClose(); }}>اختاروا لعبة</button><button className="quiet" onClick={onClose}>رجوع</button></div>
    </section>
  </div>;
}
