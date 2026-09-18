import { getAuthClient, isAuthConfigured } from './authClient';

export type QaddhaDifficulty = 'medium' | 'medium-hard' | 'hard';

export type QaddhaRemoteConfig = {
  id: 'global';
  announcement_enabled: boolean;
  announcement_text: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  content_enabled: boolean;
  sessions_enabled: boolean;
  qr_enabled: boolean;
  difficulty: QaddhaDifficulty;
  enabled_games: string[];
  updated_at?: string;
};

export const ALL_GAME_IDS = ['teams','letters','who','photo','words','fast','character','riddles','family','connection','auction','order','memory','missing','acting','secret','pressure','intruder'];

export const DEFAULT_QADDHA_CONFIG: QaddhaRemoteConfig = {
  id: 'global',
  announcement_enabled: false,
  announcement_text: 'جاهزين للتحدي؟',
  maintenance_mode: false,
  maintenance_message: 'نجري تحسينات على قدّها ونرجع لكم قريب.',
  content_enabled: true,
  sessions_enabled: true,
  qr_enabled: true,
  difficulty: 'medium-hard',
  enabled_games: ALL_GAME_IDS,
};

export async function fetchQaddhaRemoteConfig(): Promise<QaddhaRemoteConfig> {
  if (!isAuthConfigured) return DEFAULT_QADDHA_CONFIG;
  try {
    const client = await getAuthClient();
    const { data, error } = await client.from('qaddha_remote_config').select('*').eq('id', 'global').single();
    if (error || !data) return DEFAULT_QADDHA_CONFIG;
    return { ...DEFAULT_QADDHA_CONFIG, ...data, enabled_games: Array.isArray(data.enabled_games) ? data.enabled_games : ALL_GAME_IDS } as QaddhaRemoteConfig;
  } catch {
    return DEFAULT_QADDHA_CONFIG;
  }
}

export function subscribeQaddhaRemoteConfig(onChange: (config: QaddhaRemoteConfig) => void) {
  let active = true;
  let cleanup = () => {};
  void (async () => {
    const initial = await fetchQaddhaRemoteConfig();
    if (active) onChange(initial);
    if (!isAuthConfigured) return;
    const client = await getAuthClient();
    const channel = client
      .channel('qaddha-admin-config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qaddha_remote_config', filter: 'id=eq.global' }, payload => {
        const next = payload.new as Partial<QaddhaRemoteConfig>;
        if (active && next) onChange({ ...DEFAULT_QADDHA_CONFIG, ...next } as QaddhaRemoteConfig);
      })
      .subscribe();
    cleanup = () => { void client.removeChannel(channel); };
  })();
  return () => { active = false; cleanup(); };
}

export async function saveQaddhaRemoteConfig(config: QaddhaRemoteConfig): Promise<QaddhaRemoteConfig> {
  const client = await getAuthClient();
  const next: QaddhaRemoteConfig = {
    ...config,
    id: 'global',
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from('qaddha_remote_config').upsert(next, { onConflict: 'id' });
  if (error) throw error;
  return next;
}

export async function isCurrentUserQaddhaAdmin(): Promise<boolean> {
  if (!isAuthConfigured) return false;
  try {
    const client = await getAuthClient();
    const { data: sessionData } = await client.auth.getSession();
    const uid = sessionData.session?.user.id;
    if (!uid) return false;
    const { data, error } = await client.from('qaddha_admins').select('user_id').eq('user_id', uid).maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}
