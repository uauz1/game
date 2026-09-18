-- Qaddha admin live overview metrics
create or replace function private.qaddha_is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(select 1 from public.qaddha_admins where user_id = p_user_id);
$$;

revoke all on function private.qaddha_is_admin(uuid) from public, anon;
grant execute on function private.qaddha_is_admin(uuid) to authenticated;

create or replace function private.qaddha_admin_overview_impl()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null or not private.qaddha_is_admin(uid) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select jsonb_build_object(
    'users', (select count(*) from auth.users where deleted_at is null),
    'profiles', (select count(*) from public.qaddha_profiles),
    'active_24h', (select count(*) from public.qaddha_profiles where last_seen >= now() - interval '24 hours'),
    'active_rooms', (select count(*) from public.qaddha_online_rooms where status in ('waiting','ready','playing') and expires_at > now()),
    'matches_total', (select coalesce(sum(played),0) / 2 from public.qaddha_game_stats),
    'online_players', (select count(distinct user_id) from public.qaddha_online_room_members),
    'top_games', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select game_id, sum(played)::bigint as played, sum(wins)::bigint as wins, sum(draws)::bigint as draws
        from public.qaddha_game_stats
        group by game_id
        order by sum(played) desc, game_id
        limit 6
      ) t
    ), '[]'::jsonb),
    'recent_rooms', coalesce((
      select jsonb_agg(row_to_json(r))
      from (
        select rooms.id, rooms.code, rooms.game_id, rooms.mode, rooms.status,
               rooms.created_at, rooms.updated_at, rooms.expires_at,
               count(m.user_id)::int as members
        from public.qaddha_online_rooms rooms
        left join public.qaddha_online_room_members m on m.room_id = rooms.id
        group by rooms.id
        order by rooms.updated_at desc
        limit 8
      ) r
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function private.qaddha_admin_overview_impl() from public, anon;
grant execute on function private.qaddha_admin_overview_impl() to authenticated;

create or replace function public.qaddha_admin_overview()
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select private.qaddha_admin_overview_impl(); $$;

revoke all on function public.qaddha_admin_overview() from public, anon;
grant execute on function public.qaddha_admin_overview() to authenticated;
