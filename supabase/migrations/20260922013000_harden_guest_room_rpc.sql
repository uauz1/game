-- Harden guest-room RPCs:
-- keep anonymous room play, but move privileged table access into the private schema
-- and expose only SECURITY INVOKER wrappers in public.

grant usage on schema private to anon, authenticated;

drop policy if exists "guest rooms deny direct access" on public.qaddha_guest_rooms;
create policy "guest rooms deny direct access"
on public.qaddha_guest_rooms
for all
to anon, authenticated
using (false)
with check (false);

create or replace function private.qaddha_guest_create_room_impl(p_code text,p_host_token text,p_state jsonb)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare clean_code text := upper(regexp_replace(coalesce(p_code,''),'[^A-Z2-9]','','g'));
declare v_version bigint := greatest(1,coalesce((p_state->>'version')::bigint,1));
begin
  delete from public.qaddha_guest_rooms where expires_at < now();
  if clean_code !~ '^[A-HJ-NP-Z2-9]{6}$' then raise exception 'INVALID_CODE'; end if;
  if length(coalesce(p_host_token,'')) < 24 then raise exception 'INVALID_HOST_TOKEN'; end if;
  insert into public.qaddha_guest_rooms(code,host_token_hash,state,version,status)
  values (
    clean_code,
    encode(extensions.digest(p_host_token,'sha256'),'hex'),
    coalesce(p_state,'{}'::jsonb),
    v_version,
    case
      when p_state->>'phase'='playing' then 'playing'
      when p_state->>'phase'='results' then 'finished'
      else 'waiting'
    end
  );
  return jsonb_build_object('code',clean_code,'version',v_version);
exception when unique_violation then
  raise exception 'ROOM_CODE_TAKEN';
end;
$$;

create or replace function private.qaddha_guest_get_room_impl(p_code text)
returns table(state jsonb, version bigint, status text, expires_at timestamptz)
language sql security definer set search_path=''
as $$
  select r.state,r.version,r.status,r.expires_at
  from public.qaddha_guest_rooms r
  where r.code=upper(regexp_replace(coalesce(p_code,''),'[^A-Z2-9]','','g'))
    and r.status<>'closed'
    and r.expires_at>now()
  limit 1
$$;

create or replace function private.qaddha_guest_save_room_impl(p_code text,p_host_token text,p_state jsonb)
returns bigint
language plpgsql security definer set search_path=''
as $$
declare new_version bigint;
begin
  update public.qaddha_guest_rooms r
  set state=coalesce(p_state,'{}'::jsonb),
      version=greatest(r.version+1,coalesce((p_state->>'version')::bigint,r.version+1)),
      status=case
        when p_state->>'phase'='playing' then 'playing'
        when p_state->>'phase'='results' then 'finished'
        else 'waiting'
      end,
      updated_at=now(),
      expires_at=greatest(r.expires_at,now()+interval '2 hours')
  where r.code=upper(regexp_replace(coalesce(p_code,''),'[^A-Z2-9]','','g'))
    and r.host_token_hash=encode(extensions.digest(p_host_token,'sha256'),'hex')
    and r.expires_at>now()
  returning r.version into new_version;
  if new_version is null then raise exception 'HOST_AUTH_FAILED'; end if;
  return new_version;
end;
$$;

create or replace function private.qaddha_guest_close_room_impl(p_code text,p_host_token text)
returns boolean
language plpgsql security definer set search_path=''
as $$
begin
  update public.qaddha_guest_rooms r
  set status='closed',
      updated_at=now(),
      expires_at=least(expires_at,now()+interval '5 minutes')
  where r.code=upper(regexp_replace(coalesce(p_code,''),'[^A-Z2-9]','','g'))
    and r.host_token_hash=encode(extensions.digest(p_host_token,'sha256'),'hex');
  return found;
end;
$$;

revoke all on function private.qaddha_guest_create_room_impl(text,text,jsonb) from public;
revoke all on function private.qaddha_guest_get_room_impl(text) from public;
revoke all on function private.qaddha_guest_save_room_impl(text,text,jsonb) from public;
revoke all on function private.qaddha_guest_close_room_impl(text,text) from public;

grant execute on function private.qaddha_guest_create_room_impl(text,text,jsonb) to anon,authenticated;
grant execute on function private.qaddha_guest_get_room_impl(text) to anon,authenticated;
grant execute on function private.qaddha_guest_save_room_impl(text,text,jsonb) to anon,authenticated;
grant execute on function private.qaddha_guest_close_room_impl(text,text) to anon,authenticated;

create or replace function public.qaddha_guest_create_room(p_code text,p_host_token text,p_state jsonb)
returns jsonb
language sql security invoker set search_path=''
as $$ select private.qaddha_guest_create_room_impl(p_code,p_host_token,p_state) $$;

create or replace function public.qaddha_guest_get_room(p_code text)
returns table(state jsonb, version bigint, status text, expires_at timestamptz)
language sql security invoker set search_path=''
as $$ select * from private.qaddha_guest_get_room_impl(p_code) $$;

create or replace function public.qaddha_guest_save_room(p_code text,p_host_token text,p_state jsonb)
returns bigint
language sql security invoker set search_path=''
as $$ select private.qaddha_guest_save_room_impl(p_code,p_host_token,p_state) $$;

create or replace function public.qaddha_guest_close_room(p_code text,p_host_token text)
returns boolean
language sql security invoker set search_path=''
as $$ select private.qaddha_guest_close_room_impl(p_code,p_host_token) $$;

revoke all on function public.qaddha_guest_create_room(text,text,jsonb) from public;
revoke all on function public.qaddha_guest_get_room(text) from public;
revoke all on function public.qaddha_guest_save_room(text,text,jsonb) from public;
revoke all on function public.qaddha_guest_close_room(text,text) from public;

grant execute on function public.qaddha_guest_create_room(text,text,jsonb) to anon,authenticated;
grant execute on function public.qaddha_guest_get_room(text) to anon,authenticated;
grant execute on function public.qaddha_guest_save_room(text,text,jsonb) to anon,authenticated;
grant execute on function public.qaddha_guest_close_room(text,text) to anon,authenticated;
