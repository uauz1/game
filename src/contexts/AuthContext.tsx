import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getAuthClient, isAuthConfigured } from '../utils/authClient';

type AuthResult = { ok: boolean; message: string };

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
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
  return 'تعذّر إكمال الطلب الآن. حاول مرة أخرى.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isAuthConfigured);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const dismissRecovery = useCallback(() => setRecoveryMode(false), []);

  useEffect(() => {
    if (!isAuthConfigured) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void getAuthClient().then(async (client) => {
      const { data } = await client.auth.getSession();
      if (active) {
        setSession(data.session);
        setLoading(false);
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
      const { error } = await client.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: location.origin } });
      return error ? { ok: false, message: authError(error.message) } : { ok: true, message: 'أنشأنا الحساب. افتح بريدك لتأكيده.' };
    } catch { return { ok: false, message: 'خدمة الحسابات غير متاحة الآن.' }; }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin } });
      return error ? { ok: false, message: authError(error.message) } : { ok: true, message: 'جاري فتح Google…' };
    } catch { return { ok: false, message: 'خدمة الحسابات غير متاحة الآن.' }; }
  }, []);

  const requestReset = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
      return error ? { ok: false, message: authError(error.message) } : { ok: true, message: 'أرسلنا رابط الاستعادة إذا كان البريد مسجلًا.' };
    } catch { return { ok: false, message: 'خدمة الحسابات غير متاحة الآن.' }; }
  }, []);

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

  const value = useMemo(() => ({ configured: isAuthConfigured, loading, recoveryMode, dismissRecovery, session, signIn, signUp, signInWithGoogle, requestReset, updatePassword, signOut }), [dismissRecovery, loading, recoveryMode, session, signIn, signInWithGoogle, signOut, signUp, requestReset, updatePassword]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Context and hook stay together so all authentication state has one source of truth.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
