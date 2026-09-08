import { useEffect, useRef } from 'react';
import { BookOpen, Gamepad2, HelpCircle, MonitorSmartphone, ShieldCheck, Users, X } from 'lucide-react';

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
      <header><div><span><HelpCircle/> مركز المساعدة</span><h2 id="help-title">كل اللي تحتاجه قبل تبدأ</h2><p>قدّها مصممة لجمعة واحدة وشاشة واحدة، والمقدم يدير الجولة بكل سهولة.</p></div><button ref={closeRef} className="settings-close" aria-label="إغلاق المساعدة" onClick={onClose}><X/></button></header>
      <div className="help-steps"><article><b>١</b><Users/><h3>اجمعوا الفرق</h3><p>اختاروا اللعبة، سمّوا الفرق وحددوا وقت الجولة.</p></article><article><b>٢</b><MonitorSmartphone/><h3>اختاروا المقدم</h3><p>يعرض الأسئلة ويحكم الإجابات. تحدي العائلة يدعم مقدمًا من الجوال.</p></article><article><b>٣</b><Gamepad2/><h3>ابدأوا التحدي</h3><p>النقاط والإعدادات محفوظة خلال الجولة، وتقدرون تصححون آخر قرار.</p></article></div>
      <div className="help-details"><details open><summary><BookOpen/> كيف تختلف الألعاب؟</summary><p><b>قدّها فرق:</b> لوحة فئات ونقاط لفريقين. <b>حروف مع عزيز:</b> سيطروا على مسار الحروف. <b>من أنا؟</b> تلميحات وخطف للإجابة. أما بقية الألعاب فلها إعداد قصير يظهر قبل البداية.</p></details><details><summary><ShieldCheck/> وش ينحفظ على الجهاز؟</summary><p>في وضع الضيف نحفظ المفضلة، آخر الألعاب، إعدادات العرض وسجل منع تكرار الأسئلة داخل متصفحك فقط. ما نطلب اسمًا حقيقيًا، ولا نبيع أو نرسل هذه البيانات لأي جهة.</p></details><details><summary><HelpCircle/> إذا علقت الجولة؟</summary><p>ارجع للرئيسية من شعار قدّها، أو افتح الإعدادات وصفّر سجل الأسئلة إذا رغبت تبدأ دورة جديدة. تحديث الصفحة أثناء الجولة قد ينهي الجولة الحالية.</p></details></div>
      <div className="help-actions"><button className="primary" onClick={() => { onPlay(); onClose(); }}>اختاروا لعبة</button><button className="quiet" onClick={onClose}>رجوع</button></div>
    </section>
  </div>;
}
