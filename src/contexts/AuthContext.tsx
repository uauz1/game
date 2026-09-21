import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getAuthClient, getAuthProviderStatus, isAuthConfigured } from '../utils/authClient';

type AuthResult = { ok: boolean; message: string };

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  googleAvailable: boolean;
  oauthMessage: string;
  clearOauthMessage: () => void;
  recoveryMode: boolean;
  dismissRecovery: () => void;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  requestReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login')) return 'البريد أو كلمة المرور غير صحيحة.';
  if (normalized.includes('already registered') || normalized.includes('already been registered')) return 'هذا البريد مسجل من قبل.';
  if (normalized.includes('password')) return 'كلمة المرور غير مقبولة. استخدم 8 أحرف على الأقل.';
  if (normalized.includes('email')) return 'تأكد من كتابة البريد الإلكتروني بشكل صحيح.';
  if (normalized.includes('rate limit')) return 'محاولات كثيرة؛ انتظر قليلًا ثم جرّب من جديد.';
  if (normalized.includes('provider is not enabled') || normalized.includes('unsupported provider')) return 'تسجيل Google غير مفعّل في خدمة الحسابات حاليًا.';
  if (normalized.includes('redirect') || normalized.includes('callback')) return 'عنوان الرجوع من Google غير مضبوط. راجع إعدادات تسجيل الدخول.';
  if (normalized.includes('oauth')) return 'تعذّر إكمال تسجيل Google. جرّب مرة ثانية.';
  return 'تعذّر إكمال الطلب الآن. حاول مرة أخرى.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isAuthConfigured);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [oauthMessage, setOauthMessage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error_description') || params.get('error');
    return error ? authError(error) : '';
  });
  const clearOauthMessage = useCallback(() => setOauthMessage(''), []);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const dismissRecovery = useCallback(() => setRecoveryMode(false), []);

  useEffect(() => {
    if (!isAuthConfigured) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void Promise.all([getAuthClient(), getAuthProviderStatus()]).then(async ([client, providers]) => {
      if (active) setGoogleAvailable(providers.google);
      const { data } = await client.auth.getSession();
      if (active) {
        setSession(data.session);
        setLoading(false);
        if (data.session && (window.location.search.includes('code=') || window.location.search.includes('error='))) {
          const url = new URL(window.location.href);
          ['code','error','error_code','error_description'].forEach((key) => url.searchParams.delete(key));
          window.history.replaceState({}, '', url);
          setOauthMessage('');
        }
      }
      const listener = client.auth.onAuthStateChange((event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      });
      unsubscribe = () => listener.data.subscription.unsubscribe();
    }).catch(() => active && setLoading(false));
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const authRedirectUrl = useMemo(() => new URL(import.meta.env.BASE_URL, window.location.origin).href, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      return error ? { ok: false, message: authError(error.message) } : { ok: true, message: 'تم تسجيل الدخول.' };
    } catch { return { ok: false, message: 'خدمة الحسابات غير متاحة الآن.' }; }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    try {
      const client = await getAuthClient();
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: authRedirectUrl } });
      if (error) return { ok: false, message: authError(error.message) };
      return data.session
        ? { ok: true, message: 'تم إنشاء الحساب وتسجيل الدخول.' }
        : { ok: true, message: 'أنشأنا الحساب. افتح بريدك لتأكيده ثم ارجع لقدّها.' };
    } catch { return { ok: false, message: 'خدمة الحسابات غير متاحة الآن.' }; }
  }, [authRedirectUrl]);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: authRedirectUrl,
          queryParams: { prompt: 'select_account' },
          scopes: 'openid profile email https://www.googleapis.com/auth/userinfo.email',
        },
      });
      return error ? { ok: false, message: authError(error.message) } : { ok: true, message: 'جاري فتح Google…' };
    } catch { return { ok: false, message: 'خدمة الحسابات غير متاحة الآن.' }; }
  }, [authRedirectUrl]);

  const requestReset = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl });
      return error ? { ok: false, message: authError(error.message) } : { ok: true, message: 'أرسلنا رابط الاستعادة إذا كان البريد مسجلًا.' };
    } catch { return { ok: false, message: 'خدمة الحسابات غير متاحة الآن.' }; }
  }, [authRedirectUrl]);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.updateUser({ password });
      if (!error) setRecoveryMode(false);
      return error ? { ok: false, message: authError(error.message) } : { ok: true, message: 'تم تحديث كلمة المرور.' };
    } catch { return { ok: false, message: 'خدمة الحسابات غير متاحة الآن.' }; }
  }, []);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.signOut();
      return error ? { ok: false, message: authError(error.message) } : { ok: true, message: 'تم تسجيل الخروج.' };
    } catch { return { ok: false, message: 'تعذّر تسجيل الخروج.' }; }
  }, []);

  const value = useMemo(() => ({ configured: isAuthConfigured, loading, googleAvailable, oauthMessage, clearOauthMessage, recoveryMode, dismissRecovery, session, signIn, signUp, signInWithGoogle, requestReset, updatePassword, signOut }), [clearOauthMessage, dismissRecovery, googleAvailable, loading, oauthMessage, recoveryMode, session, signIn, signInWithGoogle, signOut, signUp, requestReset, updatePassword]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Context and hook stay together so all authentication state has one source of truth.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
