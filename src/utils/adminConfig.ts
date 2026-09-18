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
  const { data, error } = await client.rpc('qaddha_admin_save_config', { p_config: config });
  if (error) throw error;
  const next = (data || {}) as Partial<QaddhaRemoteConfig>;
  return { ...DEFAULT_QADDHA_CONFIG, ...next, enabled_games: Array.isArray(next.enabled_games) ? next.enabled_games : ALL_GAME_IDS } as QaddhaRemoteConfig;
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


export type QaddhaAdminOverview = {
  users: number;
  profiles: number;
  active_24h: number;
  active_rooms: number;
  matches_total: number;
  online_players: number;
  top_games: { game_id: string; played: number; wins: number; draws: number }[];
  recent_rooms: { id:string; code:string; game_id:string; mode:'private'|'quick'; status:string; created_at:string; updated_at:string; expires_at:string; members:number }[];
};

export async function fetchQaddhaAdminOverview(): Promise<QaddhaAdminOverview> {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_admin_overview');
  if (error) throw error;
  const value = (data || {}) as Partial<QaddhaAdminOverview>;
  return {
    users: Number(value.users || 0),
    profiles: Number(value.profiles || 0),
    active_24h: Number(value.active_24h || 0),
    active_rooms: Number(value.active_rooms || 0),
    matches_total: Number(value.matches_total || 0),
    online_players: Number(value.online_players || 0),
    top_games: Array.isArray(value.top_games) ? value.top_games : [],
    recent_rooms: Array.isArray(value.recent_rooms) ? value.recent_rooms : [],
  };
}


export type QaddhaAdminPlayer = {
  user_id: string;
  email: string | null;
  display_name: string;
  xp: number;
  games_played: number;
  wins: number;
  last_seen: string;
  created_at: string;
};

export type QaddhaAdminAuditEntry = {
  id: number;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  admin_name: string;
};

export async function fetchQaddhaAdminPlayers(limit = 50): Promise<QaddhaAdminPlayer[]> {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_admin_players', { p_limit: limit });
  if (error) throw error;
  return Array.isArray(data) ? data as QaddhaAdminPlayer[] : [];
}

export async function fetchQaddhaAdminAudit(limit = 30): Promise<QaddhaAdminAuditEntry[]> {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_admin_audit', { p_limit: limit });
  if (error) throw error;
  return Array.isArray(data) ? data as QaddhaAdminAuditEntry[] : [];
}

export async function cancelQaddhaOnlineRoom(roomId: string, reason = 'manual_admin_cancel'): Promise<boolean> {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_admin_cancel_room', { p_room_id: roomId, p_reason: reason });
  if (error) throw error;
  return data === true;
}


export async function isQaddhaAdminBootstrapAvailable(): Promise<boolean> {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_admin_bootstrap_available');
  if (error) throw error;
  return data === true;
}

export async function bootstrapFirstQaddhaAdmin(): Promise<boolean> {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_bootstrap_first_admin');
  if (error) throw error;
  return data === true;
}
