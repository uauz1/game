-- Qaddha production accounts + online multiplayer schema
-- Mirrors the production Supabase structure after the 2026-09-18 online upgrade.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.qaddha_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.qaddha_remote_config (
  id text primary key default 'global',
  announcement_enabled boolean not null default false,
  announcement_text text not null default 'جاهزين للتحدي؟',
  maintenance_mode boolean not null default false,
  maintenance_message text not null default 'نجري تحسينات على قدّها ونرجع لكم قريب.',
  content_enabled boolean not null default true,
  sessions_enabled boolean not null default true,
  qr_enabled boolean not null default true,
  difficulty text not null default 'medium-hard' check (difficulty in ('medium','medium-hard','hard')),
  enabled_games text[] not null default array['teams','letters','who','photo','words','fast','character','riddles','family','connection','auction','order','memory','missing','acting','secret','pressure','intruder']::text[],
  updated_at timestamptz not null default now()
);

insert into public.qaddha_remote_config(id) values ('global') on conflict (id) do nothing;

create table if not exists public.qaddha_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  avatar_url text,
  xp integer not null default 0 check (xp >= 0),
  games_played integer not null default 0 check (games_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qaddha_player_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorites text[] not null default '{}',
  recent jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.qaddha_online_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  mode text not null default 'private' check (mode in ('private','quick')),
  status text not null default 'waiting' check (status in ('waiting','ready','playing','finished','cancelled')),
  max_players smallint not null default 2 check (max_players between 2 and 8),
  version bigint not null default 0,
  result_recorded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 hours')
);

create table if not exists public.qaddha_online_room_members (
  room_id uuid not null references public.qaddha_online_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  seat smallint not null check (seat between 0 and 7),
  team smallint not null default 0 check (team between 0 and 1),
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (room_id,user_id),
  unique (room_id,seat)
);

create table if not exists public.qaddha_online_game_state (
  room_id uuid primary key references public.qaddha_online_rooms(id) on delete cascade,
  version bigint not null default 0,
  phase text not null default 'lobby',
  state jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.qaddha_matchmaking_queue (
  user_id uuid primary key references auth.users(id) on delete cascade,
  game_id text not null,
  status text not null default 'waiting' check (status in ('waiting','matched','cancelled')),
  room_id uuid references public.qaddha_online_rooms(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qaddha_game_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  played integer not null default 0 check (played >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  score bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id,game_id)
);

create index if not exists qaddha_online_rooms_waiting_idx on public.qaddha_online_rooms(game_id,mode,status,created_at) where status='waiting';
create index if not exists qaddha_online_members_user_idx on public.qaddha_online_room_members(user_id,last_seen desc);
create index if not exists qaddha_rooms_host_idx on public.qaddha_online_rooms(host_user_id);
create index if not exists qaddha_game_state_updated_by_idx on public.qaddha_online_game_state(updated_by) where updated_by is not null;
create index if not exists qaddha_queue_room_idx on public.qaddha_matchmaking_queue(room_id) where room_id is not null;

alter table public.qaddha_admins enable row level security;
alter table public.qaddha_remote_config enable row level security;
alter table public.qaddha_profiles enable row level security;
alter table public.qaddha_player_state enable row level security;
alter table public.qaddha_online_rooms enable row level security;
alter table public.qaddha_online_room_members enable row level security;
alter table public.qaddha_online_game_state enable row level security;
alter table public.qaddha_matchmaking_queue enable row level security;
alter table public.qaddha_game_stats enable row level security;

create or replace function public.qaddha_touch_updated_at()
returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end;
$$;

drop trigger if exists qaddha_profiles_touch on public.qaddha_profiles;
create trigger qaddha_profiles_touch before update on public.qaddha_profiles for each row execute function public.qaddha_touch_updated_at();
drop trigger if exists qaddha_player_state_touch on public.qaddha_player_state;
create trigger qaddha_player_state_touch before update on public.qaddha_player_state for each row execute function public.qaddha_touch_updated_at();
drop trigger if exists qaddha_rooms_touch on public.qaddha_online_rooms;
create trigger qaddha_rooms_touch before update on public.qaddha_online_rooms for each row execute function public.qaddha_touch_updated_at();
drop trigger if exists qaddha_queue_touch on public.qaddha_matchmaking_queue;
create trigger qaddha_queue_touch before update on public.qaddha_matchmaking_queue for each row execute function public.qaddha_touch_updated_at();
drop trigger if exists qaddha_stats_touch on public.qaddha_game_stats;
create trigger qaddha_stats_touch before update on public.qaddha_game_stats for each row execute function public.qaddha_touch_updated_at();

create or replace function public.qaddha_create_profile_for_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare safe_name text;
begin
  safe_name := left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),split_part(coalesce(new.email,'لاعب'),'@',1),'لاعب'),24);
  insert into public.qaddha_profiles(user_id,display_name) values(new.id,safe_name) on conflict(user_id) do nothing;
  insert into public.qaddha_player_state(user_id) values(new.id) on conflict(user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.qaddha_create_profile_for_user() from public,anon,authenticated;

drop trigger if exists qaddha_auth_profile on auth.users;
create trigger qaddha_auth_profile after insert on auth.users for each row execute function public.qaddha_create_profile_for_user();

insert into public.qaddha_profiles(user_id,display_name)
select u.id,left(coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'),''),split_part(coalesce(u.email,'لاعب'),'@',1),'لاعب'),24)
from auth.users u on conflict(user_id) do nothing;
insert into public.qaddha_player_state(user_id) select id from auth.users on conflict(user_id) do nothing;

create or replace function public.qaddha_random_room_code()
returns text language plpgsql volatile set search_path='' as $$
declare chars text:='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; out_code text:=''; i int;
begin
  for i in 1..6 loop out_code:=out_code||substr(chars,1+floor(random()*length(chars))::int,1); end loop;
  return out_code;
end;
$$;
revoke all on function public.qaddha_random_room_code() from public,anon,authenticated;

create or replace function private.qaddha_is_room_member(p_room_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.qaddha_online_room_members where room_id=p_room_id and user_id=p_user_id);
$$;
revoke all on function private.qaddha_is_room_member(uuid,uuid) from public,anon;
grant execute on function private.qaddha_is_room_member(uuid,uuid) to authenticated;

drop policy if exists "qaddha admins self read" on public.qaddha_admins;
create policy "qaddha admins self read" on public.qaddha_admins for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "qaddha config public read" on public.qaddha_remote_config;
create policy "qaddha config public read" on public.qaddha_remote_config for select using(true);
drop policy if exists "qaddha config admin insert" on public.qaddha_remote_config;
create policy "qaddha config admin insert" on public.qaddha_remote_config for insert to authenticated with check(exists(select 1 from public.qaddha_admins a where a.user_id=(select auth.uid())));
drop policy if exists "qaddha config admin update" on public.qaddha_remote_config;
create policy "qaddha config admin update" on public.qaddha_remote_config for update to authenticated using(exists(select 1 from public.qaddha_admins a where a.user_id=(select auth.uid()))) with check(exists(select 1 from public.qaddha_admins a where a.user_id=(select auth.uid())));
drop policy if exists "qaddha config admin delete" on public.qaddha_remote_config;
create policy "qaddha config admin delete" on public.qaddha_remote_config for delete to authenticated using(exists(select 1 from public.qaddha_admins a where a.user_id=(select auth.uid())));

drop policy if exists "users read own profile" on public.qaddha_profiles;
create policy "users read own profile" on public.qaddha_profiles for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "users update own profile" on public.qaddha_profiles;
create policy "users update own profile" on public.qaddha_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists "users read own player state" on public.qaddha_player_state;
create policy "users read own player state" on public.qaddha_player_state for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "users insert own player state" on public.qaddha_player_state;
create policy "users insert own player state" on public.qaddha_player_state for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists "users update own player state" on public.qaddha_player_state;
create policy "users update own player state" on public.qaddha_player_state for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists "members can read their rooms" on public.qaddha_online_rooms;
create policy "members can read their rooms" on public.qaddha_online_rooms for select to authenticated using(host_user_id=(select auth.uid()) or private.qaddha_is_room_member(id,(select auth.uid())));
drop policy if exists "hosts can update rooms" on public.qaddha_online_rooms;
create policy "hosts can update rooms" on public.qaddha_online_rooms for update to authenticated using(host_user_id=(select auth.uid())) with check(host_user_id=(select auth.uid()));

drop policy if exists "members can read room members" on public.qaddha_online_room_members;
create policy "members can read room members" on public.qaddha_online_room_members for select to authenticated using(private.qaddha_is_room_member(room_id,(select auth.uid())));
drop policy if exists "users update own membership" on public.qaddha_online_room_members;
create policy "users update own membership" on public.qaddha_online_room_members for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists "users leave own membership" on public.qaddha_online_room_members;
create policy "users leave own membership" on public.qaddha_online_room_members for delete to authenticated using(user_id=(select auth.uid()));

drop policy if exists "members can read game state" on public.qaddha_online_game_state;
create policy "members can read game state" on public.qaddha_online_game_state for select to authenticated using(private.qaddha_is_room_member(room_id,(select auth.uid())));
drop policy if exists "room host can write game state" on public.qaddha_online_game_state;
create policy "room host can write game state" on public.qaddha_online_game_state for insert to authenticated with check(exists(select 1 from public.qaddha_online_rooms r where r.id=room_id and r.host_user_id=(select auth.uid())));
drop policy if exists "room host can update game state" on public.qaddha_online_game_state;
create policy "room host can update game state" on public.qaddha_online_game_state for update to authenticated using(exists(select 1 from public.qaddha_online_rooms r where r.id=room_id and r.host_user_id=(select auth.uid()))) with check(exists(select 1 from public.qaddha_online_rooms r where r.id=room_id and r.host_user_id=(select auth.uid())));

drop policy if exists "users read own queue row" on public.qaddha_matchmaking_queue;
create policy "users read own queue row" on public.qaddha_matchmaking_queue for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "users delete own queue row" on public.qaddha_matchmaking_queue;
create policy "users delete own queue row" on public.qaddha_matchmaking_queue for delete to authenticated using(user_id=(select auth.uid()));
drop policy if exists "users read own stats" on public.qaddha_game_stats;
create policy "users read own stats" on public.qaddha_game_stats for select to authenticated using(user_id=(select auth.uid()));

create or replace function private.qaddha_create_online_room_impl(p_game_id text,p_mode text default 'private')
returns table(room_id uuid,room_code text,game_id text,room_status text)
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); profile_name text; new_id uuid; new_code text; tries int:=0;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_mode not in ('private','quick') then raise exception 'INVALID_MODE'; end if;
  select display_name into profile_name from public.qaddha_profiles where user_id=uid;
  if profile_name is null then raise exception 'PROFILE_REQUIRED'; end if;
  loop
    tries:=tries+1; new_code:=public.qaddha_random_room_code();
    begin
      insert into public.qaddha_online_rooms(code,host_user_id,game_id,mode) values(new_code,uid,left(p_game_id,40),p_mode) returning id into new_id;
      exit;
    exception when unique_violation then if tries>=8 then raise; end if;
    end;
  end loop;
  insert into public.qaddha_online_room_members(room_id,user_id,display_name,seat,team) values(new_id,uid,profile_name,0,0);
  insert into public.qaddha_online_game_state(room_id,updated_by) values(new_id,uid);
  return query select new_id,new_code,left(p_game_id,40),'waiting'::text;
end;
$$;

create or replace function private.qaddha_join_online_room_impl(p_code text)
returns table(room_id uuid,room_code text,game_id text,room_status text,seat smallint)
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); r public.qaddha_online_rooms%rowtype; profile_name text; next_seat smallint;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select rooms.* into r from public.qaddha_online_rooms rooms
  where rooms.code=upper(regexp_replace(p_code,'[^A-Z2-9]','','g')) and rooms.status in ('waiting','ready','playing') and rooms.expires_at>now()
  for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  select p.display_name into profile_name from public.qaddha_profiles p where p.user_id=uid;
  if exists(select 1 from public.qaddha_online_room_members existing where existing.room_id=r.id and existing.user_id=uid) then
    select existing.seat into next_seat from public.qaddha_online_room_members existing where existing.room_id=r.id and existing.user_id=uid;
  else
    select s::smallint into next_seat from generate_series(0,r.max_players-1) s
    where not exists(select 1 from public.qaddha_online_room_members occupied where occupied.room_id=r.id and occupied.seat=s)
    order by s limit 1;
    if next_seat is null then raise exception 'ROOM_FULL'; end if;
    insert into public.qaddha_online_room_members(room_id,user_id,display_name,seat,team) values(r.id,uid,profile_name,next_seat,(next_seat%2)::smallint);
  end if;
  if (select count(*) from public.qaddha_online_room_members member_count where member_count.room_id=r.id)>=2 and r.status='waiting' then
    update public.qaddha_online_rooms rooms set status='ready' where rooms.id=r.id; r.status:='ready';
  end if;
  return query select r.id,r.code,r.game_id,r.status,next_seat;
end;
$$;

create or replace function private.qaddha_quick_match_impl(p_game_id text)
returns table(room_id uuid,room_code text,game_id text,room_status text,seat smallint)
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); candidate uuid; created record;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  delete from public.qaddha_matchmaking_queue where user_id=uid or created_at<now()-interval '10 minutes';
  select r.id into candidate from public.qaddha_online_rooms r
  where r.game_id=left(p_game_id,40) and r.mode='quick' and r.status='waiting' and r.host_user_id<>uid and r.expires_at>now()
    and (select count(*) from public.qaddha_online_room_members m where m.room_id=r.id)<r.max_players
  order by r.created_at for update skip locked limit 1;
  if candidate is not null then
    return query select j.room_id,j.room_code,j.game_id,j.room_status,j.seat
    from private.qaddha_join_online_room_impl((select code from public.qaddha_online_rooms where id=candidate)) j;
    return;
  end if;
  select * into created from private.qaddha_create_online_room_impl(left(p_game_id,40),'quick');
  insert into public.qaddha_matchmaking_queue(user_id,game_id,status,room_id)
  values(uid,left(p_game_id,40),'waiting',created.room_id)
  on conflict(user_id) do update set game_id=excluded.game_id,status='waiting',room_id=excluded.room_id,created_at=now(),updated_at=now();
  return query select created.room_id,created.room_code,created.game_id,created.room_status,0::smallint;
end;
$$;

create or replace function private.qaddha_leave_online_room_impl(p_room_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  delete from public.qaddha_matchmaking_queue where user_id=uid;
  delete from public.qaddha_online_room_members where room_id=p_room_id and user_id=uid;
  if not exists(select 1 from public.qaddha_online_room_members where room_id=p_room_id) then
    delete from public.qaddha_online_rooms where id=p_room_id;
  elsif exists(select 1 from public.qaddha_online_rooms where id=p_room_id and host_user_id=uid) then
    update public.qaddha_online_rooms set host_user_id=(select user_id from public.qaddha_online_room_members where room_id=p_room_id order by seat limit 1) where id=p_room_id;
  end if;
end;
$$;

create or replace function private.qaddha_record_duel_result_impl(p_room_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); r public.qaddha_online_rooms%rowtype; gs public.qaddha_online_game_state%rowtype;
m0 public.qaddha_online_room_members%rowtype; m1 public.qaddha_online_room_members%rowtype; s0 int:=0; s1 int:=0;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into r from public.qaddha_online_rooms where id=p_room_id for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if r.host_user_id<>uid then raise exception 'HOST_REQUIRED'; end if;
  if r.result_recorded then return false; end if;
  select * into gs from public.qaddha_online_game_state where room_id=p_room_id;
  if not found or coalesce((gs.state->>'finished')::boolean,false) is not true then raise exception 'GAME_NOT_FINISHED'; end if;
  select * into m0 from public.qaddha_online_room_members where room_id=p_room_id order by seat asc limit 1;
  select * into m1 from public.qaddha_online_room_members where room_id=p_room_id order by seat asc offset 1 limit 1;
  if m0.user_id is null or m1.user_id is null then raise exception 'PLAYERS_REQUIRED'; end if;
  s0:=coalesce((gs.state->'scores'->>m0.user_id::text)::int,0);
  s1:=coalesce((gs.state->'scores'->>m1.user_id::text)::int,0);
  insert into public.qaddha_game_stats(user_id,game_id,played,wins,losses,draws,score)
  values(m0.user_id,r.game_id,1,case when s0>s1 then 1 else 0 end,case when s0<s1 then 1 else 0 end,case when s0=s1 then 1 else 0 end,s0)
  on conflict(user_id,game_id) do update set played=public.qaddha_game_stats.played+1,wins=public.qaddha_game_stats.wins+excluded.wins,losses=public.qaddha_game_stats.losses+excluded.losses,draws=public.qaddha_game_stats.draws+excluded.draws,score=public.qaddha_game_stats.score+excluded.score,updated_at=now();
  insert into public.qaddha_game_stats(user_id,game_id,played,wins,losses,draws,score)
  values(m1.user_id,r.game_id,1,case when s1>s0 then 1 else 0 end,case when s1<s0 then 1 else 0 end,case when s0=s1 then 1 else 0 end,s1)
  on conflict(user_id,game_id) do update set played=public.qaddha_game_stats.played+1,wins=public.qaddha_game_stats.wins+excluded.wins,losses=public.qaddha_game_stats.losses+excluded.losses,draws=public.qaddha_game_stats.draws+excluded.draws,score=public.qaddha_game_stats.score+excluded.score,updated_at=now();
  update public.qaddha_profiles set games_played=games_played+1,wins=wins+case when s0>s1 then 1 else 0 end,xp=xp+case when s0>s1 then 140 when s0=s1 then 90 else 60 end,last_seen=now() where user_id=m0.user_id;
  update public.qaddha_profiles set games_played=games_played+1,wins=wins+case when s1>s0 then 1 else 0 end,xp=xp+case when s1>s0 then 140 when s0=s1 then 90 else 60 end,last_seen=now() where user_id=m1.user_id;
  update public.qaddha_online_rooms set result_recorded=true,status='finished' where id=p_room_id;
  return true;
end;
$$;

revoke all on function private.qaddha_create_online_room_impl(text,text) from public,anon;
revoke all on function private.qaddha_join_online_room_impl(text) from public,anon;
revoke all on function private.qaddha_quick_match_impl(text) from public,anon;
revoke all on function private.qaddha_leave_online_room_impl(uuid) from public,anon;
revoke all on function private.qaddha_record_duel_result_impl(uuid) from public,anon;
grant execute on function private.qaddha_create_online_room_impl(text,text) to authenticated;
grant execute on function private.qaddha_join_online_room_impl(text) to authenticated;
grant execute on function private.qaddha_quick_match_impl(text) to authenticated;
grant execute on function private.qaddha_leave_online_room_impl(uuid) to authenticated;
grant execute on function private.qaddha_record_duel_result_impl(uuid) to authenticated;

create or replace function public.qaddha_create_online_room(p_game_id text,p_mode text default 'private')
returns table(room_id uuid,room_code text,game_id text,room_status text) language sql security invoker set search_path='' as $$
select * from private.qaddha_create_online_room_impl(p_game_id,p_mode);
$$;
create or replace function public.qaddha_join_online_room(p_code text)
returns table(room_id uuid,room_code text,game_id text,room_status text,seat smallint) language sql security invoker set search_path='' as $$
select * from private.qaddha_join_online_room_impl(p_code);
$$;
create or replace function public.qaddha_quick_match(p_game_id text)
returns table(room_id uuid,room_code text,game_id text,room_status text,seat smallint) language sql security invoker set search_path='' as $$
select * from private.qaddha_quick_match_impl(p_game_id);
$$;
create or replace function public.qaddha_leave_online_room(p_room_id uuid)
returns void language sql security invoker set search_path='' as $$
select private.qaddha_leave_online_room_impl(p_room_id);
$$;
create or replace function public.qaddha_record_duel_result(p_room_id uuid)
returns boolean language sql security invoker set search_path='' as $$
select private.qaddha_record_duel_result_impl(p_room_id);
$$;

revoke all on function public.qaddha_create_online_room(text,text) from public,anon;
revoke all on function public.qaddha_join_online_room(text) from public,anon;
revoke all on function public.qaddha_quick_match(text) from public,anon;
revoke all on function public.qaddha_leave_online_room(uuid) from public,anon;
revoke all on function public.qaddha_record_duel_result(uuid) from public,anon;
grant execute on function public.qaddha_create_online_room(text,text) to authenticated;
grant execute on function public.qaddha_join_online_room(text) to authenticated;
grant execute on function public.qaddha_quick_match(text) to authenticated;
grant execute on function public.qaddha_leave_online_room(uuid) to authenticated;
grant execute on function public.qaddha_record_duel_result(uuid) to authenticated;

create or replace function private.claim_first_qaddha_admin_impl()
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists(select 1 from public.qaddha_admins) then return false; end if;
  insert into public.qaddha_admins(user_id) values(auth.uid()) on conflict do nothing;
  return true;
end;
$$;
revoke all on function private.claim_first_qaddha_admin_impl() from public,anon;
grant execute on function private.claim_first_qaddha_admin_impl() to authenticated;
create or replace function public.claim_first_qaddha_admin()
returns boolean language sql security invoker set search_path='' as $$
select private.claim_first_qaddha_admin_impl();
$$;
revoke all on function public.claim_first_qaddha_admin() from public,anon;
grant execute on function public.claim_first_qaddha_admin() to authenticated;


drop policy if exists "online members can receive room realtime" on realtime.messages;
create policy "online members can receive room realtime" on realtime.messages for select to authenticated using(
  realtime.messages.extension in ('broadcast','presence')
  and case when (select realtime.topic()) ~ '^qaddha:online:[0-9a-f-]{36}$'
    then private.qaddha_is_room_member(substring((select realtime.topic()) from 'qaddha:online:([0-9a-f-]{36})')::uuid,(select auth.uid()))
    else false end
);
drop policy if exists "online members can send room realtime" on realtime.messages;
create policy "online members can send room realtime" on realtime.messages for insert to authenticated with check(
  realtime.messages.extension in ('broadcast','presence')
  and case when (select realtime.topic()) ~ '^qaddha:online:[0-9a-f-]{36}$'
    then private.qaddha_is_room_member(substring((select realtime.topic()) from 'qaddha:online:([0-9a-f-]{36})')::uuid,(select auth.uid()))
    else false end
);

grant select on public.qaddha_remote_config to anon,authenticated;
grant select,update on public.qaddha_profiles to authenticated;
grant select,insert,update on public.qaddha_player_state to authenticated;
grant select,update on public.qaddha_online_rooms to authenticated;
grant select,update,delete on public.qaddha_online_room_members to authenticated;
grant select,insert,update on public.qaddha_online_game_state to authenticated;
grant select,delete on public.qaddha_matchmaking_queue to authenticated;
grant select on public.qaddha_game_stats to authenticated;
