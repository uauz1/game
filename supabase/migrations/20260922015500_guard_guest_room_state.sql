-- Bound anonymous guest-room payloads so public RPCs cannot store unbounded state.
create or replace function private.qaddha_guest_state_is_valid(p_state jsonb)
returns boolean
language sql immutable set search_path=''
as $$
  select
    jsonb_typeof(coalesce(p_state,'{}'::jsonb)) = 'object'
    and octet_length(coalesce(p_state,'{}'::jsonb)::text) <= 131072
    and (
      not (coalesce(p_state,'{}'::jsonb) ? 'players')
      or (
        jsonb_typeof(p_state->'players') = 'array'
        and jsonb_array_length(p_state->'players') <= 12
      )
    )
    and (
      not (coalesce(p_state,'{}'::jsonb) ? 'maxPlayers')
      or (
        (p_state->>'maxPlayers') ~ '^[0-9]+$'
        and (p_state->>'maxPlayers')::int between 2 and 12
      )
    )
$$;

revoke all on function private.qaddha_guest_state_is_valid(jsonb) from public;
grant execute on function private.qaddha_guest_state_is_valid(jsonb) to anon, authenticated;

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
  if not private.qaddha_guest_state_is_valid(p_state) then raise exception 'INVALID_ROOM_STATE'; end if;

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

create or replace function private.qaddha_guest_save_room_impl(p_code text,p_host_token text,p_state jsonb)
returns bigint
language plpgsql security definer set search_path=''
as $$
declare new_version bigint;
begin
  if not private.qaddha_guest_state_is_valid(p_state) then raise exception 'INVALID_ROOM_STATE'; end if;

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
