import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://uhbtcjlapgpsohbkotpd.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  || 'sb_publishable_zviAFEw4s4YDpW2pdo-W1g_aCDWMpvO';

export const isAuthConfigured = Boolean(supabaseUrl && supabasePublishableKey);

let clientPromise: Promise<SupabaseClient> | null = null;

export function getAuthClient(): Promise<SupabaseClient> {
  if (!isAuthConfigured || !supabaseUrl || !supabasePublishableKey) {
    return Promise.reject(new Error('AUTH_NOT_CONFIGURED'));
  }
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }));
  return clientPromise;
}
