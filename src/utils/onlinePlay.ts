import type { RealtimeChannel } from '@supabase/supabase-js';
import { getAuthClient } from './authClient';

export type OnlineRoom = {
  id: string;
  code: string;
  host_user_id: string;
  game_id: string;
  mode: 'private' | 'quick';
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'cancelled';
  max_players: number;
  version: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
};

export type OnlineMember = {
  room_id: string;
  user_id: string;
  display_name: string;
  seat: number;
  team: number;
  joined_at: string;
  last_seen: string;
};

export type OnlineGameState = {
  room_id: string;
  version: number;
  phase: string;
  state: Record<string, unknown>;
  updated_by: string | null;
  updated_at: string;
};

export type OnlineRoomSnapshot = {
  room: OnlineRoom;
  members: OnlineMember[];
  gameState: OnlineGameState | null;
};

function unwrapRpcRow<T>(data: unknown): T {
  if (!Array.isArray(data) || !data[0]) throw new Error('ONLINE_EMPTY_RESPONSE');
  return data[0] as T;
}

export async function getMyOnlineProfile() {
  const client = await getAuthClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) throw new Error('AUTH_REQUIRED');
  const { data, error } = await client.from('qaddha_profiles').select('*').eq('user_id', user.id).single();
  if (error) throw error;
  return data as { user_id:string; display_name:string; avatar_url:string|null; xp:number; games_played:number; wins:number };
}

export async function updateOnlineDisplayName(displayName: string) {
  const clean = displayName.trim().slice(0,24);
  if (!clean) throw new Error('INVALID_NAME');
  const client = await getAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  const { error } = await client.from('qaddha_profiles').update({ display_name: clean, last_seen: new Date().toISOString() }).eq('user_id', user.id);
  if (error) throw error;
  await client.auth.updateUser({ data: { display_name: clean } });
  return clean;
}

export async function createPrivateOnlineRoom(gameId = 'fast') {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_create_online_room', { p_game_id: gameId, p_mode: 'private' });
  if (error) throw error;
  return unwrapRpcRow<{room_id:string;room_code:string;game_id:string;room_status:string}>(data);
}

export async function joinPrivateOnlineRoom(code: string) {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_join_online_room', { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  return unwrapRpcRow<{room_id:string;room_code:string;game_id:string;room_status:string;seat:number}>(data);
}

export async function findQuickOnlineMatch(gameId = 'fast') {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_quick_match', { p_game_id: gameId });
  if (error) throw error;
  return unwrapRpcRow<{room_id:string;room_code:string;game_id:string;room_status:string;seat:number}>(data);
}

export async function leaveOnlineRoom(roomId: string) {
  const client = await getAuthClient();
  const { error } = await client.rpc('qaddha_leave_online_room', { p_room_id: roomId });
  if (error) throw error;
}

export async function getOnlineRoomSnapshot(roomId: string): Promise<OnlineRoomSnapshot> {
  const client = await getAuthClient();
  const [roomResult, memberResult, stateResult] = await Promise.all([
    client.from('qaddha_online_rooms').select('*').eq('id',roomId).single(),
    client.from('qaddha_online_room_members').select('*').eq('room_id',roomId).order('seat'),
    client.from('qaddha_online_game_state').select('*').eq('room_id',roomId).maybeSingle(),
  ]);
  if (roomResult.error) throw roomResult.error;
  if (memberResult.error) throw memberResult.error;
  if (stateResult.error) throw stateResult.error;
  return {
    room: roomResult.data as OnlineRoom,
    members: (memberResult.data || []) as OnlineMember[],
    gameState: stateResult.data as OnlineGameState | null,
  };
}

export async function saveOnlineGameState(roomId: string, phase: string, state: Record<string, unknown>, version: number) {
  const client = await getAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  const { error } = await client.from('qaddha_online_game_state').upsert({
    room_id: roomId,
    phase,
    state,
    version,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'room_id' });
  if (error) throw error;
}

export async function markOnlineRoomStatus(roomId: string, status: OnlineRoom['status']) {
  const client = await getAuthClient();
  const { error } = await client.from('qaddha_online_rooms').update({ status, version: Date.now() }).eq('id',roomId);
  if (error) throw error;
}

export async function openOnlineRoomChannel(
  roomId: string,
  presenceKey: string,
  onEvent: (event: string, payload: Record<string, unknown>) => void,
  onPresence: (onlineUserIds: string[]) => void,
  onStatus?: (status: string) => void,
): Promise<RealtimeChannel> {
  const client = await getAuthClient();
  const channel = client.channel(`qaddha:online:${roomId}`, {
    config: {
      private: true,
      broadcast: { self: true, ack: true },
      presence: { key: presenceKey },
    },
  });
  channel
    .on('broadcast', { event: 'duel' }, ({payload}) => onEvent('duel', (payload || {}) as Record<string,unknown>))
    .on('presence', { event: 'sync' }, () => {
      const ids = Object.values(channel.presenceState<{userId?:string}>()).flat().map(item=>item.userId).filter((value):value is string=>Boolean(value));
      onPresence([...new Set(ids)]);
    })
    .subscribe(async status => {
      onStatus?.(status);
      if (status === 'SUBSCRIBED') {
        await channel.track({ userId: presenceKey, at: Date.now() });
      }
    });
  return channel;
}

export async function closeOnlineRoomChannel(channel: RealtimeChannel | null) {
  if (!channel) return;
  try {
    await channel.untrack();
    const client = await getAuthClient();
    await client.removeChannel(channel);
  } catch {
    // A stale websocket must never block leaving the room.
  }
}


export async function findMyActiveOnlineRoom(): Promise<OnlineRoomSnapshot | null> {
  const client = await getAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data: memberships, error } = await client
    .from('qaddha_online_room_members')
    .select('room_id,last_seen')
    .eq('user_id', user.id)
    .order('last_seen', { ascending: false })
    .limit(5);
  if (error) throw error;
  for (const membership of memberships || []) {
    try {
      const snapshot = await getOnlineRoomSnapshot(membership.room_id as string);
      if (snapshot.room.status !== 'finished' && snapshot.room.status !== 'cancelled' && new Date(snapshot.room.expires_at).getTime() > Date.now()) return snapshot;
    } catch {
      // Ignore stale membership rows and keep looking.
    }
  }
  return null;
}


export async function recordOnlineDuelResult(roomId: string) {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_record_duel_result', { p_room_id: roomId });
  if (error) throw error;
  return data === true;
}


export type QaddhaAccountSummary = {
  profile: { user_id:string; display_name:string; avatar_url:string|null; xp:number; games_played:number; wins:number; last_seen:string };
  stats: { game_id:string; played:number; wins:number; losses:number; draws:number; score:number }[];
  friends: number;
};

export async function touchOnlinePresence() {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_touch_presence');
  if (error) throw error;
  return data as string;
}

export async function getQaddhaAccountSummary(): Promise<QaddhaAccountSummary> {
  const client = await getAuthClient();
  const { data, error } = await client.rpc('qaddha_account_summary');
  if (error) throw error;
  return data as QaddhaAccountSummary;
}


export type QaddhaFriend = {
  user_id:string; display_name:string; avatar_url:string|null;
  status:'pending'|'accepted'|'blocked'; incoming:boolean; last_seen:string;
};
export type QaddhaMatchHistory = {
  id:string; room_id:string; opponent_user_id:string|null; game_id:string;
  result:'win'|'loss'|'draw'; score:number; opponent_score:number; xp_earned:number; played_at:string;
};

export async function getMyFriends(): Promise<QaddhaFriend[]> {
  const client=await getAuthClient();
  const {data,error}=await client.rpc('qaddha_my_friends');
  if(error) throw error;
  return (data||[]) as QaddhaFriend[];
}
export async function findOnlinePlayers(query:string) {
  const client=await getAuthClient();
  const {data,error}=await client.rpc('qaddha_find_player',{p_query:query.trim()});
  if(error) throw error;
  return (data||[]) as {user_id:string;display_name:string;avatar_url:string|null;last_seen:string}[];
}
export async function sendFriendRequest(userId:string) {
  const client=await getAuthClient(); const {error}=await client.rpc('qaddha_send_friend_request',{p_user_id:userId}); if(error) throw error;
}
export async function acceptFriendRequest(userId:string) {
  const client=await getAuthClient(); const {error}=await client.rpc('qaddha_accept_friend_request',{p_user_id:userId}); if(error) throw error;
}
export async function removeFriend(userId:string) {
  const client=await getAuthClient(); const {error}=await client.rpc('qaddha_remove_friend',{p_user_id:userId}); if(error) throw error;
}
export async function getMyOnlineMatchHistory(limit=20):Promise<QaddhaMatchHistory[]> {
  const client=await getAuthClient(); const {data:{user}}=await client.auth.getUser(); if(!user) throw new Error('AUTH_REQUIRED');
  const {data,error}=await client.from('qaddha_match_history').select('*').eq('user_id',user.id).order('played_at',{ascending:false}).limit(limit);
  if(error) throw error; return (data||[]) as QaddhaMatchHistory[];
}
