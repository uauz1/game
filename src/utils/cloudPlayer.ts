import { getAuthClient } from './authClient';

export type CloudPlayerState = {
  favorites: string[];
  recent: {gameId:string;playedAt:number}[];
  settings?: Record<string, unknown>;
};

export async function loadCloudPlayerState(): Promise<CloudPlayerState | null> {
  const client = await getAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data, error } = await client.from('qaddha_player_state').select('favorites,recent,settings').eq('user_id',user.id).maybeSingle();
  if (error) throw error;
  if (!data) return { favorites: [], recent: [], settings: {} };
  return {
    favorites: Array.isArray(data.favorites) ? data.favorites.filter((v):v is string=>typeof v==='string') : [],
    recent: Array.isArray(data.recent) ? data.recent.filter((v):v is {gameId:string;playedAt:number}=>Boolean(v&&typeof v.gameId==='string'&&typeof v.playedAt==='number')) : [],
    settings: data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings) ? data.settings as Record<string,unknown> : {},
  };
}

export async function saveCloudPlayerState(state: CloudPlayerState) {
  const client = await getAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;
  const { error } = await client.from('qaddha_player_state').upsert({
    user_id:user.id,
    favorites:state.favorites.slice(0,64),
    recent:state.recent.slice(0,64),
    settings:state.settings || {},
    updated_at:new Date().toISOString(),
  }, {onConflict:'user_id'});
  if (error) throw error;
}

export function mergePlayerState(local: CloudPlayerState, cloud: CloudPlayerState): CloudPlayerState {
  const favorites=[...new Set([...cloud.favorites,...local.favorites])];
  const map=new Map<string,{gameId:string;playedAt:number}>();
  [...cloud.recent,...local.recent].forEach(item=>{
    const current=map.get(item.gameId);
    if(!current||item.playedAt>current.playedAt)map.set(item.gameId,item);
  });
  return {favorites,recent:[...map.values()].sort((a,b)=>b.playedAt-a.playedAt).slice(0,64),settings:{...(cloud.settings||{}),...(local.settings||{})}};
}
