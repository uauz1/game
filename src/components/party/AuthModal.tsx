import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, AtSign, KeyRound, LockKeyhole, ShieldCheck, UserRound, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'signin' | 'signup' | 'forgot' | 'recovery';

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (auth.recoveryMode) setMode('recovery'); }, [auth.recoveryMode]);
  useEffect(() => {
    if (!open) return;
    setNotice('');
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [onClose, open]);

  if (!open || !auth.configured) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if ((mode === 'signup' || mode === 'recovery') && password.length < 8) { setNotice('كلمة المرور لازم تكون 8 أحرف على الأقل.'); return; }
    if ((mode === 'signup' || mode === 'recovery') && password !== confirmPassword) { setNotice('كلمتا المرور غير متطابقتين.'); return; }
    setBusy(true);
    const result = mode === 'signin' ? await auth.signIn(email, password)
      : mode === 'signup' ? await auth.signUp(email, password, displayName)
      : mode === 'forgot' ? await auth.requestReset(email)
      : await auth.updatePassword(password);
    setBusy(false);
    setNotice(result.message);
    if (result.ok && (mode === 'signin' || mode === 'recovery')) window.setTimeout(onClose, 650);
  };

  const titles: Record<Mode, [string, string]> = {
    signin: ['رجعت تنوّر قدّها', 'ادخل بحسابك وخلك قريب من مفضّلتك وسجلك.'],
    signup: ['حساب جديد', 'خطوة واحدة وتكون جمعتك محفوظة معك.'],
    forgot: ['نسيت كلمة المرور؟', 'أرسل لك رابط آمن لاستعادتها.'],
    recovery: ['اختر كلمة مرور جديدة', 'خلّها قوية ومختلفة عن كلماتك السابقة.'],
  };

  return <div className="auth-overlay" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button ref={closeRef} className="settings-close auth-close" aria-label="إغلاق" onClick={onClose}><X/></button>
      <div className="auth-mark"><ShieldCheck/></div><h2 id="auth-title">{titles[mode][0]}</h2><p>{titles[mode][1]}</p>
      {(mode === 'signin' || mode === 'signup') && <div className="auth-tabs"><button aria-pressed={mode === 'signin'} onClick={() => { setMode('signin'); setNotice(''); }}>دخول</button><button aria-pressed={mode === 'signup'} onClick={() => { setMode('signup'); setNotice(''); }}>حساب جديد</button></div>}
      <form onSubmit={submit}>
        {mode === 'signup' && <label><span><UserRound/> الاسم</span><input required autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="الاسم اللي يظهر لك"/></label>}
        {mode !== 'recovery' && <label><span><AtSign/> البريد الإلكتروني</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr"/></label>}
        {mode !== 'forgot' && <label><span><LockKeyhole/> كلمة المرور</span><input required minLength={mode === 'signin' ? 1 : 8} type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" dir="ltr"/></label>}
        {(mode === 'signup' || mode === 'recovery') && <label><span><KeyRound/> تأكيد كلمة المرور</span><input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" dir="ltr"/></label>}
        {mode === 'signin' && <button type="button" className="auth-text-button" onClick={() => { setMode('forgot'); setNotice(''); }}>نسيت كلمة المرور؟</button>}
        <button className="primary auth-submit" disabled={busy}>{busy ? 'لحظة…' : mode === 'signin' ? 'تسجيل الدخول' : mode === 'signup' ? 'إنشاء الحساب' : mode === 'forgot' ? 'إرسال رابط الاستعادة' : 'حفظ كلمة المرور'}</button>
      </form>
      {(mode === 'signin' || mode === 'signup') && <><div className="auth-divider"><span>أو</span></div><button className="google-auth" disabled={busy} onClick={async () => { setBusy(true); const result = await auth.signInWithGoogle(); setNotice(result.message); if (!result.ok) setBusy(false); }}><b>G</b> المتابعة باستخدام Google</button></>}
      {(mode === 'forgot' || mode === 'recovery') && <button className="auth-back" onClick={() => { setMode('signin'); setNotice(''); }}><ArrowRight/> الرجوع لتسجيل الدخول</button>}
      {notice && <div className="auth-notice" role="status" aria-live="polite">{notice}</div>}
      <small className="auth-privacy">بيانات الدخول تُرسل مباشرة إلى خدمة الحسابات المشفّرة ولا تُحفظ داخل صفحات قدّها.</small>
    </section>
  </div>;
}
