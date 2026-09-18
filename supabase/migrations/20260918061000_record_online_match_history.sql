-- Persist finished online duels into each player's account history.
create or replace function public.qaddha_record_duel_result(p_room_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  r public.qaddha_online_rooms%rowtype;
  gs public.qaddha_online_game_state%rowtype;
  m record; other record;
  my_score integer; other_score integer; outcome text; earned integer;
begin
  select * into r from public.qaddha_online_rooms where id=p_room_id;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if auth.uid() is null or not exists(select 1 from public.qaddha_online_room_members where room_id=p_room_id and user_id=auth.uid()) then raise exception 'AUTH_REQUIRED'; end if;
  select * into gs from public.qaddha_online_game_state where room_id=p_room_id;
  if not found or coalesce((gs.state->>'finished')::boolean,false)=false then return false; end if;
  for m in select * from public.qaddha_online_room_members where room_id=p_room_id loop
    select * into other from public.qaddha_online_room_members where room_id=p_room_id and user_id<>m.user_id order by seat limit 1;
    my_score:=coalesce((gs.state->'scores'->>m.user_id::text)::integer,0);
    other_score:=coalesce((gs.state->'scores'->>other.user_id::text)::integer,0);
    outcome:=case when my_score>other_score then 'win' when my_score<other_score then 'loss' else 'draw' end;
    earned:=case outcome when 'win' then 120 when 'draw' then 70 else 40 end;
    insert into public.qaddha_match_history(room_id,user_id,opponent_user_id,game_id,result,score,opponent_score,xp_earned)
    values(p_room_id,m.user_id,other.user_id,r.game_id,outcome,my_score,other_score,earned)
    on conflict(room_id,user_id) do nothing;
  end loop;
  return true;
end; $$;
grant execute on function public.qaddha_record_duel_result(uuid) to authenticated;
