-- A room membership is not an entitlement snapshot. Recheck onboarding and
-- university verification on every protected read/control path so a revoked
-- campus member cannot retain room access through an old membership row.

create or replace function public.is_study_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_access_study_room(p_room_id)
    and exists (
      select 1
      from public.study_room_members as member
      where member.room_id = p_room_id
        and member.user_id = (select auth.uid())
    );
$$;

create or replace function public.set_study_room_member_role(
  p_room_id uuid,
  p_user_id uuid,
  p_role text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if not public.can_access_study_room(p_room_id) then
    raise exception 'Study room access is unavailable'
      using errcode = '42501';
  end if;

  if p_role not in ('cohost', 'member') then
    raise exception 'Unknown room role'
      using errcode = '22023';
  end if;

  perform 1
  from public.study_rooms as room
  where room.id = p_room_id
    and room.ends_at > now()
  for update;

  if not found then
    return false;
  end if;

  if not exists (
    select 1
    from public.study_room_members as actor
    where actor.room_id = p_room_id
      and actor.user_id = actor_id
      and actor.role = 'host'
  ) then
    raise exception 'Only the current host can manage co-hosts'
      using errcode = '42501';
  end if;

  if p_user_id = actor_id then
    raise exception 'The current host role cannot be changed here'
      using errcode = '22023';
  end if;

  update public.study_room_members as member
  set role = p_role
  where member.room_id = p_room_id
    and member.user_id = p_user_id
    and member.role <> 'host';

  return found;
end;
$$;

create or replace function public.update_study_room_timer(
  p_room_id uuid,
  p_action text,
  p_expected_revision bigint default null
)
returns table (
  timer_phase text,
  timer_status text,
  timer_remaining_seconds integer,
  timer_revision bigint,
  cycles_completed integer,
  server_now timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  selected_room public.study_rooms%rowtype;
  effective_remaining integer;
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if not public.can_access_study_room(p_room_id) then
    raise exception 'Study room access is unavailable'
      using errcode = '42501';
  end if;

  if p_action not in ('start', 'pause', 'reset', 'skip') then
    raise exception 'Unknown timer action'
      using errcode = '22023';
  end if;

  select *
  into selected_room
  from public.study_rooms as room
  where room.id = p_room_id
    and room.ends_at > now()
  for update;

  if not found then
    raise exception 'Study room is unavailable'
      using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.study_room_members as member
    where member.room_id = p_room_id
      and member.user_id = actor_id
      and member.role in ('host', 'cohost')
  ) then
    raise exception 'Host controls are required'
      using errcode = '42501';
  end if;

  if p_expected_revision is not null
    and p_expected_revision <> selected_room.timer_revision then
    raise exception 'Timer state changed; refresh and try again'
      using errcode = '40001';
  end if;

  effective_remaining := public.study_room_timer_remaining(
    selected_room.timer_status,
    selected_room.timer_remaining_seconds,
    selected_room.timer_anchor_at
  );

  if p_action = 'start' then
    if effective_remaining = 0 then
      effective_remaining := case selected_room.timer_phase
        when 'focus' then selected_room.focus_minutes * 60
        else selected_room.break_minutes * 60
      end;
    end if;

    update public.study_rooms as room
    set
      timer_status = 'running',
      timer_remaining_seconds = effective_remaining,
      timer_anchor_at = clock_timestamp(),
      timer_revision = room.timer_revision + 1
    where room.id = p_room_id;
  elsif p_action = 'pause' then
    update public.study_rooms as room
    set
      timer_status = 'paused',
      timer_remaining_seconds = effective_remaining,
      timer_anchor_at = null,
      timer_revision = room.timer_revision + 1
    where room.id = p_room_id;
  elsif p_action = 'reset' then
    update public.study_rooms as room
    set
      timer_status = 'paused',
      timer_remaining_seconds = case selected_room.timer_phase
        when 'focus' then selected_room.focus_minutes * 60
        else selected_room.break_minutes * 60
      end,
      timer_anchor_at = null,
      timer_revision = room.timer_revision + 1
    where room.id = p_room_id;
  else
    update public.study_rooms as room
    set
      timer_phase = case selected_room.timer_phase
        when 'focus' then 'break'
        else 'focus'
      end,
      timer_status = 'paused',
      timer_remaining_seconds = case selected_room.timer_phase
        when 'focus' then selected_room.break_minutes * 60
        else selected_room.focus_minutes * 60
      end,
      timer_anchor_at = null,
      timer_revision = room.timer_revision + 1,
      cycles_completed = room.cycles_completed
        + case when selected_room.timer_phase = 'break' then 1 else 0 end
    where room.id = p_room_id;
  end if;

  return query
  select
    room.timer_phase,
    room.timer_status,
    public.study_room_timer_remaining(
      room.timer_status,
      room.timer_remaining_seconds,
      room.timer_anchor_at
    ),
    room.timer_revision,
    room.cycles_completed,
    clock_timestamp()
  from public.study_rooms as room
  where room.id = p_room_id;
end;
$$;

create or replace function public.send_study_room_message(
  p_room_id uuid,
  p_body text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_name text;
  created_message_id bigint;
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if not public.can_access_study_room(p_room_id) then
    raise exception 'Study room access is unavailable'
      using errcode = '42501';
  end if;

  if p_body is null or char_length(trim(p_body)) not between 1 and 1000 then
    raise exception 'Message must contain between 1 and 1000 characters'
      using errcode = '22023';
  end if;

  select member.display_name_snapshot
  into actor_name
  from public.study_room_members as member
  join public.study_rooms as room on room.id = member.room_id
  where member.room_id = p_room_id
    and member.user_id = actor_id
    and room.ends_at > now();

  if actor_name is null then
    raise exception 'Active room membership is required'
      using errcode = '42501';
  end if;

  insert into public.study_room_messages (
    room_id,
    author_id,
    author_display_name,
    body
  )
  values (p_room_id, actor_id, actor_name, trim(p_body))
  returning id into created_message_id;

  return created_message_id;
end;
$$;

create or replace function public.end_study_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if not public.can_access_study_room(p_room_id) then
    raise exception 'Study room access is unavailable'
      using errcode = '42501';
  end if;

  perform 1
  from public.study_rooms as room
  where room.id = p_room_id
  for update;

  if not found then
    return false;
  end if;

  if not exists (
    select 1
    from public.study_room_members as member
    where member.room_id = p_room_id
      and member.user_id = actor_id
      and member.role = 'host'
  ) then
    raise exception 'Only the current host can end this room'
      using errcode = '42501';
  end if;

  delete from public.study_rooms as room where room.id = p_room_id;
  return true;
end;
$$;
