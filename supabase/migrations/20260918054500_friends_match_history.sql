-- Friends, invites and online match history for Qaddha
create table if not exists public.qaddha_friendships (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  requested_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,friend_user_id),
  check(user_id <> friend_user_id)
);

create table if not exists public.qaddha_match_history (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  opponent_user_id uuid references auth.users(id) on delete set null,
  game_id text not null,
  result text not null check(result in ('win','loss','draw')),
  score integer not null default 0,
  opponent_score integer not null default 0,
  xp_earned integer not null default 0,
  played_at timestamptz not null default now(),
  unique(room_id,user_id)
);
create index if not exists qaddha_match_history_user_idx on public.qaddha_match_history(user_id,played_at desc);

alter table public.qaddha_friendships enable row level security;
alter table public.qaddha_match_history enable row level security;

drop policy if exists "friendships participants read" on public.qaddha_friendships;
create policy "friendships participants read" on public.qaddha_friendships for select to authenticated
using(user_id=(select auth.uid()) or friend_user_id=(select auth.uid()));
drop policy if exists "match history own read" on public.qaddha_match_history;
create policy "match history own read" on public.qaddha_match_history for select to authenticated
using(user_id=(select auth.uid()));

create or replace function public.qaddha_send_friend_request(p_user_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare me uuid := auth.uid();
begin
 if me is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_user_id=me then raise exception 'INVALID_FRIEND'; end if;
 insert into public.qaddha_friendships(user_id,friend_user_id,status,requested_by)
 values(least(me,p_user_id),greatest(me,p_user_id),'pending',me)
 on conflict(user_id,friend_user_id) do update set status='pending',requested_by=me,updated_at=now();
 return true;
end; $$;
grant execute on function public.qaddha_send_friend_request(uuid) to authenticated;

create or replace function public.qaddha_accept_friend_request(p_user_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare me uuid := auth.uid();
begin
 update public.qaddha_friendships set status='accepted',updated_at=now()
 where user_id=least(me,p_user_id) and friend_user_id=greatest(me,p_user_id)
 and requested_by<>me and status='pending';
 return found;
end; $$;
grant execute on function public.qaddha_accept_friend_request(uuid) to authenticated;

create or replace function public.qaddha_remove_friend(p_user_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare me uuid := auth.uid();
begin
 delete from public.qaddha_friendships where user_id=least(me,p_user_id) and friend_user_id=greatest(me,p_user_id);
 return found;
end; $$;
grant execute on function public.qaddha_remove_friend(uuid) to authenticated;

create or replace function public.qaddha_my_friends()
returns table(user_id uuid,display_name text,avatar_url text,status text,incoming boolean,last_seen timestamptz)
language sql security definer set search_path='' as $$
 with f as (
  select case when x.user_id=auth.uid() then x.friend_user_id else x.user_id end other_id,
         x.status, (x.requested_by<>auth.uid()) incoming
  from public.qaddha_friendships x
  where x.user_id=auth.uid() or x.friend_user_id=auth.uid()
 )
 select p.user_id,p.display_name,p.avatar_url,f.status,f.incoming,p.last_seen
 from f join public.qaddha_profiles p on p.user_id=f.other_id order by p.last_seen desc;
$$;
grant execute on function public.qaddha_my_friends() to authenticated;

create or replace function public.qaddha_find_player(p_query text)
returns table(user_id uuid,display_name text,avatar_url text,last_seen timestamptz)
language sql security definer set search_path='' as $$
 select p.user_id,p.display_name,p.avatar_url,p.last_seen from public.qaddha_profiles p
 where p.user_id<>auth.uid() and char_length(trim(p_query))>=2
 and lower(p.display_name) like '%'||lower(trim(p_query))||'%' order by p.last_seen desc limit 12;
$$;
grant execute on function public.qaddha_find_player(text) to authenticated;
