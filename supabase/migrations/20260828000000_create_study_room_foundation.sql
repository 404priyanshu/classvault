-- Durable, permission-scoped study rooms with ephemeral lifecycle semantics.

create table public.study_room_plan_limits (
  plan text primary key,
  member_capacity smallint not null,
  duration_minutes integer not null,
  maximum_focus_minutes smallint not null,
  maximum_break_minutes smallint not null,
  constraint study_room_plan_limits_plan
    check (plan in ('free', 'pro')),
  constraint study_room_plan_limits_capacity
    check (member_capacity between 2 and 100),
  constraint study_room_plan_limits_duration
    check (duration_minutes between 15 and 1440),
  constraint study_room_plan_limits_focus
    check (maximum_focus_minutes between 5 and 180),
  constraint study_room_plan_limits_break
    check (maximum_break_minutes between 1 and 60)
);

insert into public.study_room_plan_limits (
  plan,
  member_capacity,
  duration_minutes,
  maximum_focus_minutes,
  maximum_break_minutes
)
values
  ('free', 8, 120, 60, 20),
  ('pro', 24, 240, 120, 30);

create table public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles (id) on delete set null,
  name text not null,
  subject_tag text not null,
  visibility text not null,
  university_id bigint references public.universities (id) on delete restrict,
  host_plan_snapshot text not null,
  member_capacity smallint not null,
  focus_minutes smallint not null,
  break_minutes smallint not null,
  timer_phase text not null default 'focus',
  timer_status text not null default 'paused',
  timer_remaining_seconds integer not null,
  timer_anchor_at timestamptz,
  timer_revision bigint not null default 0,
  cycles_completed integer not null default 0,
  created_at timestamptz not null default now(),
  ends_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint study_rooms_name_length
    check (char_length(trim(name)) between 3 and 80),
  constraint study_rooms_subject_length
    check (char_length(trim(subject_tag)) between 2 and 60),
  constraint study_rooms_visibility
    check (visibility in ('public', 'university')),
  constraint study_rooms_university_scope
    check (
      (visibility = 'public' and university_id is null)
      or (visibility = 'university' and university_id is not null)
    ),
  constraint study_rooms_plan
    check (host_plan_snapshot in ('free', 'pro')),
  constraint study_rooms_capacity
    check (member_capacity between 2 and 100),
  constraint study_rooms_focus_minutes
    check (focus_minutes between 5 and 180),
  constraint study_rooms_break_minutes
    check (break_minutes between 1 and 60),
  constraint study_rooms_timer_phase
    check (timer_phase in ('focus', 'break')),
  constraint study_rooms_timer_status
    check (timer_status in ('paused', 'running')),
  constraint study_rooms_timer_remaining
    check (timer_remaining_seconds between 0 and 10800),
  constraint study_rooms_timer_anchor
    check (
      (timer_status = 'running' and timer_anchor_at is not null)
      or (timer_status = 'paused' and timer_anchor_at is null)
    ),
  constraint study_rooms_timer_revision
    check (timer_revision >= 0),
  constraint study_rooms_cycles
    check (cycles_completed >= 0),
  constraint study_rooms_lifetime
    check (ends_at > created_at)
);

create index study_rooms_access_created_idx
  on public.study_rooms (visibility, university_id, created_at desc, id);

create index study_rooms_expiry_idx
  on public.study_rooms (ends_at, id);

create index study_rooms_created_by_idx
  on public.study_rooms (created_by)
  where created_by is not null;

create table public.study_room_members (
  room_id uuid not null references public.study_rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  display_name_snapshot text not null,
  avatar_url_snapshot text,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  constraint study_room_members_role
    check (role in ('host', 'cohost', 'member')),
  constraint study_room_members_name_length
    check (char_length(trim(display_name_snapshot)) between 2 and 80),
  constraint study_room_members_avatar_length
    check (
      avatar_url_snapshot is null
      or char_length(avatar_url_snapshot) <= 2048
    )
);

create unique index study_room_members_one_host_idx
  on public.study_room_members (room_id)
  where role = 'host';

create index study_room_members_user_joined_idx
  on public.study_room_members (user_id, joined_at desc, room_id);

create index study_room_members_room_role_joined_idx
  on public.study_room_members (room_id, role, joined_at, user_id);

create table public.study_room_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.study_rooms (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  author_display_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint study_room_messages_author_length
    check (char_length(trim(author_display_name)) between 2 and 80),
  constraint study_room_messages_body_length
    check (char_length(trim(body)) between 1 and 1000)
);

create index study_room_messages_room_created_idx
  on public.study_room_messages (room_id, created_at desc, id desc);

create index study_room_messages_author_idx
  on public.study_room_messages (author_id, created_at desc)
  where author_id is not null;

create trigger study_rooms_set_updated_at
before update on public.study_rooms
for each row execute function public.set_profile_updated_at();

create function public.current_study_room_plan()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  -- Billing can replace this resolver without changing room creation.
  select 'free'::text;
$$;

create function public.is_study_room_eligible()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.onboarding_completed_at is not null
  );
$$;

create function public.is_study_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.study_room_members as member
    where member.room_id = p_room_id
      and member.user_id = (select auth.uid())
  );
$$;

create function public.can_access_study_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_study_room_eligible()
    and exists (
      select 1
      from public.study_rooms as room
      where room.id = p_room_id
        and room.ends_at > now()
        and (
          room.visibility = 'public'
          or exists (
            select 1
            from public.university_memberships as membership
            where membership.user_id = (select auth.uid())
              and membership.university_id = room.university_id
              and membership.status = 'verified'
          )
        )
    );
$$;

create function public.study_room_timer_remaining(
  p_status text,
  p_remaining_seconds integer,
  p_anchor_at timestamptz
)
returns integer
language sql
stable
set search_path = ''
as $$
  select case
    when p_status = 'running' and p_anchor_at is not null then
      greatest(
        0,
        p_remaining_seconds
          - floor(extract(epoch from (clock_timestamp() - p_anchor_at)))::integer
      )
    else p_remaining_seconds
  end;
$$;

create function public.list_study_rooms()
returns table (
  room_id uuid,
  room_name text,
  subject_tag text,
  visibility text,
  university_id bigint,
  university_name text,
  host_display_name text,
  member_count bigint,
  member_capacity integer,
  current_user_joined boolean,
  timer_phase text,
  timer_status text,
  timer_remaining_seconds integer,
  timer_revision bigint,
  cycles_completed integer,
  created_at timestamptz,
  ends_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    room.id,
    room.name,
    room.subject_tag,
    room.visibility,
    room.university_id,
    university.name,
    host.display_name_snapshot,
    (select count(*) from public.study_room_members as counted where counted.room_id = room.id),
    room.member_capacity::integer,
    exists (
      select 1
      from public.study_room_members as own_member
      where own_member.room_id = room.id
        and own_member.user_id = (select auth.uid())
    ),
    room.timer_phase,
    room.timer_status,
    public.study_room_timer_remaining(
      room.timer_status,
      room.timer_remaining_seconds,
      room.timer_anchor_at
    ),
    room.timer_revision,
    room.cycles_completed,
    room.created_at,
    room.ends_at
  from public.study_rooms as room
  left join public.universities as university on university.id = room.university_id
  left join lateral (
    select member.display_name_snapshot
    from public.study_room_members as member
    where member.room_id = room.id
      and member.role = 'host'
    limit 1
  ) as host on true
  where public.can_access_study_room(room.id)
  order by
    exists (
      select 1
      from public.study_room_members as own_member
      where own_member.room_id = room.id
        and own_member.user_id = (select auth.uid())
    ) desc,
    room.created_at desc,
    room.id;
$$;

create function public.create_study_room(
  p_name text,
  p_subject_tag text,
  p_visibility text,
  p_focus_minutes smallint,
  p_break_minutes smallint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_name text;
  actor_avatar text;
  selected_plan text := public.current_study_room_plan();
  selected_limits public.study_room_plan_limits%rowtype;
  selected_university_id bigint;
  created_room_id uuid := gen_random_uuid();
begin
  if actor_id is null or not public.is_study_room_eligible() then
    raise exception 'Completed onboarding is required'
      using errcode = '42501';
  end if;

  if p_name is null or char_length(trim(p_name)) not between 3 and 80 then
    raise exception 'Room name must contain between 3 and 80 characters'
      using errcode = '22023';
  end if;

  if p_subject_tag is null
    or char_length(trim(p_subject_tag)) not between 2 and 60 then
    raise exception 'Subject must contain between 2 and 60 characters'
      using errcode = '22023';
  end if;

  if p_visibility not in ('public', 'university') then
    raise exception 'Unknown room visibility'
      using errcode = '22023';
  end if;

  select *
  into selected_limits
  from public.study_room_plan_limits as limits
  where limits.plan = selected_plan;

  if not found then
    raise exception 'Study-room plan limits are unavailable'
      using errcode = '55000';
  end if;

  if p_focus_minutes not between 5 and selected_limits.maximum_focus_minutes
    or p_break_minutes not between 1 and selected_limits.maximum_break_minutes then
    raise exception 'Timer values exceed the current plan limits'
      using errcode = '22023';
  end if;

  if p_visibility = 'university' then
    select membership.university_id
    into selected_university_id
    from public.university_memberships as membership
    where membership.user_id = actor_id
      and membership.status = 'verified';

    if selected_university_id is null then
      raise exception 'Verified university membership is required'
        using errcode = '42501';
    end if;
  end if;

  select
    coalesce(nullif(trim(profile.display_name), ''), 'ClassVault student'),
    profile.avatar_url
  into actor_name, actor_avatar
  from public.profiles as profile
  where profile.id = actor_id;

  insert into public.study_rooms (
    id,
    created_by,
    name,
    subject_tag,
    visibility,
    university_id,
    host_plan_snapshot,
    member_capacity,
    focus_minutes,
    break_minutes,
    timer_remaining_seconds,
    ends_at
  )
  values (
    created_room_id,
    actor_id,
    trim(p_name),
    trim(p_subject_tag),
    p_visibility,
    selected_university_id,
    selected_plan,
    selected_limits.member_capacity,
    p_focus_minutes,
    p_break_minutes,
    p_focus_minutes * 60,
    now() + make_interval(mins => selected_limits.duration_minutes)
  );

  insert into public.study_room_members (
    room_id,
    user_id,
    role,
    display_name_snapshot,
    avatar_url_snapshot
  )
  values (
    created_room_id,
    actor_id,
    'host',
    actor_name,
    actor_avatar
  );

  return created_room_id;
end;
$$;

create function public.join_study_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_name text;
  actor_avatar text;
  selected_room public.study_rooms%rowtype;
  joined_count integer;
begin
  if actor_id is null or not public.is_study_room_eligible() then
    raise exception 'Completed onboarding is required'
      using errcode = '42501';
  end if;

  select *
  into selected_room
  from public.study_rooms as room
  where room.id = p_room_id
  for update;

  if not found or selected_room.ends_at <= now() then
    raise exception 'Study room is unavailable'
      using errcode = 'P0002';
  end if;

  if not public.can_access_study_room(p_room_id) then
    raise exception 'Study room access is unavailable'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.study_room_members as member
    where member.room_id = p_room_id
      and member.user_id = actor_id
  ) then
    return true;
  end if;

  select count(*)
  into joined_count
  from public.study_room_members as member
  where member.room_id = p_room_id;

  if joined_count >= selected_room.member_capacity then
    raise exception 'Study room is full'
      using errcode = '54000';
  end if;

  select
    coalesce(nullif(trim(profile.display_name), ''), 'ClassVault student'),
    profile.avatar_url
  into actor_name, actor_avatar
  from public.profiles as profile
  where profile.id = actor_id;

  insert into public.study_room_members (
    room_id,
    user_id,
    display_name_snapshot,
    avatar_url_snapshot
  )
  values (p_room_id, actor_id, actor_name, actor_avatar);

  return true;
end;
$$;

create function public.leave_study_room(p_room_id uuid)
returns table (
  room_deleted boolean,
  new_host_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  departing_role text;
  promoted_host_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  perform 1
  from public.study_rooms as room
  where room.id = p_room_id
  for update;

  if not found then
    return query select true, null::uuid;
    return;
  end if;

  select member.role
  into departing_role
  from public.study_room_members as member
  where member.room_id = p_room_id
    and member.user_id = actor_id
  for update;

  if not found then
    return query select false, null::uuid;
    return;
  end if;

  delete from public.study_room_members as member
  where member.room_id = p_room_id
    and member.user_id = actor_id;

  if departing_role = 'host' then
    select member.user_id
    into promoted_host_id
    from public.study_room_members as member
    where member.room_id = p_room_id
      and member.role = 'cohost'
    order by member.joined_at, member.user_id
    limit 1
    for update;

    if promoted_host_id is not null then
      update public.study_room_members as member
      set role = 'host'
      where member.room_id = p_room_id
        and member.user_id = promoted_host_id;
    end if;
  end if;

  if not exists (
    select 1 from public.study_room_members as member where member.room_id = p_room_id
  ) then
    delete from public.study_rooms as room where room.id = p_room_id;
    return query select true, null::uuid;
    return;
  end if;

  return query select false, promoted_host_id;
end;
$$;

create function public.set_study_room_member_role(
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

create function public.update_study_room_timer(
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

create function public.send_study_room_message(
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

create function public.get_study_room_snapshot(p_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  snapshot jsonb;
begin
  if actor_id is null or not public.is_study_room_member(p_room_id) then
    return null;
  end if;

  select jsonb_build_object(
    'room', jsonb_build_object(
      'id', room.id,
      'name', room.name,
      'subjectTag', room.subject_tag,
      'visibility', room.visibility,
      'universityName', university.name,
      'memberCapacity', room.member_capacity,
      'focusMinutes', room.focus_minutes,
      'breakMinutes', room.break_minutes,
      'timerPhase', room.timer_phase,
      'timerStatus', room.timer_status,
      'timerRemainingSeconds', public.study_room_timer_remaining(
        room.timer_status,
        room.timer_remaining_seconds,
        room.timer_anchor_at
      ),
      'timerRevision', room.timer_revision,
      'cyclesCompleted', room.cycles_completed,
      'createdAt', room.created_at,
      'endsAt', room.ends_at,
      'serverNow', clock_timestamp()
    ),
    'viewerRole', viewer.role,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', member.user_id,
        'displayName', member.display_name_snapshot,
        'avatarUrl', member.avatar_url_snapshot,
        'role', member.role,
        'joinedAt', member.joined_at
      ) order by
        case member.role when 'host' then 0 when 'cohost' then 1 else 2 end,
        member.joined_at,
        member.user_id)
      from public.study_room_members as member
      where member.room_id = room.id
    ), '[]'::jsonb),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', recent_message.id,
        'authorId', recent_message.author_id,
        'authorDisplayName', recent_message.author_display_name,
        'body', recent_message.body,
        'createdAt', recent_message.created_at
      ) order by recent_message.created_at, recent_message.id)
      from (
        select message.*
        from public.study_room_messages as message
        where message.room_id = room.id
        order by message.created_at desc, message.id desc
        limit 100
      ) as recent_message
    ), '[]'::jsonb)
  )
  into snapshot
  from public.study_rooms as room
  join public.study_room_members as viewer
    on viewer.room_id = room.id
   and viewer.user_id = actor_id
  left join public.universities as university on university.id = room.university_id
  where room.id = p_room_id;

  return snapshot;
end;
$$;

create function public.end_study_room(p_room_id uuid)
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

create function public.purge_expired_study_rooms()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  with deleted as (
    delete from public.study_rooms as room
    where room.ends_at <= now()
    returning room.id
  )
  select count(*)::integer into deleted_count from deleted;

  return deleted_count;
end;
$$;

alter table public.study_room_plan_limits enable row level security;
alter table public.study_room_plan_limits force row level security;
alter table public.study_rooms enable row level security;
alter table public.study_rooms force row level security;
alter table public.study_room_members enable row level security;
alter table public.study_room_members force row level security;
alter table public.study_room_messages enable row level security;
alter table public.study_room_messages force row level security;

revoke all on table public.study_room_plan_limits from anon, authenticated;
revoke all on table public.study_rooms from anon, authenticated;
revoke all on table public.study_room_members from anon, authenticated;
revoke all on table public.study_room_messages from anon, authenticated;
revoke all on sequence public.study_room_messages_id_seq from anon, authenticated;

grant select on table public.study_rooms to authenticated;
grant select on table public.study_room_members to authenticated;
grant select on table public.study_room_messages to authenticated;

create policy "study_rooms_select_accessible"
  on public.study_rooms
  for select
  to authenticated
  using (
    public.can_access_study_room(id)
    or public.is_study_room_member(id)
  );

create policy "study_room_members_select_room_members"
  on public.study_room_members
  for select
  to authenticated
  using (public.is_study_room_member(room_id));

create policy "study_room_messages_select_room_members"
  on public.study_room_messages
  for select
  to authenticated
  using (public.is_study_room_member(room_id));

revoke all on function public.current_study_room_plan() from public, anon, authenticated;
revoke all on function public.is_study_room_eligible() from public, anon, authenticated;
revoke all on function public.is_study_room_member(uuid) from public, anon, authenticated;
revoke all on function public.can_access_study_room(uuid) from public, anon, authenticated;
revoke all on function public.study_room_timer_remaining(text,integer,timestamptz) from public, anon, authenticated;
revoke all on function public.list_study_rooms() from public, anon, authenticated;
revoke all on function public.create_study_room(text,text,text,smallint,smallint) from public, anon, authenticated;
revoke all on function public.join_study_room(uuid) from public, anon, authenticated;
revoke all on function public.leave_study_room(uuid) from public, anon, authenticated;
revoke all on function public.set_study_room_member_role(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.update_study_room_timer(uuid,text,bigint) from public, anon, authenticated;
revoke all on function public.send_study_room_message(uuid,text) from public, anon, authenticated;
revoke all on function public.get_study_room_snapshot(uuid) from public, anon, authenticated;
revoke all on function public.end_study_room(uuid) from public, anon, authenticated;
revoke all on function public.purge_expired_study_rooms() from public, anon, authenticated;

grant execute on function public.is_study_room_eligible() to authenticated;
grant execute on function public.is_study_room_member(uuid) to authenticated;
grant execute on function public.can_access_study_room(uuid) to authenticated;
grant execute on function public.list_study_rooms() to authenticated;
grant execute on function public.create_study_room(text,text,text,smallint,smallint) to authenticated;
grant execute on function public.join_study_room(uuid) to authenticated;
grant execute on function public.leave_study_room(uuid) to authenticated;
grant execute on function public.set_study_room_member_role(uuid,uuid,text) to authenticated;
grant execute on function public.update_study_room_timer(uuid,text,bigint) to authenticated;
grant execute on function public.send_study_room_message(uuid,text) to authenticated;
grant execute on function public.get_study_room_snapshot(uuid) to authenticated;
grant execute on function public.end_study_room(uuid) to authenticated;
grant execute on function public.purge_expired_study_rooms() to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'study_rooms'
  ) then
    alter publication supabase_realtime add table public.study_rooms;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'study_room_members'
  ) then
    alter publication supabase_realtime add table public.study_room_members;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'study_room_messages'
  ) then
    alter publication supabase_realtime add table public.study_room_messages;
  end if;
end;
$$;

comment on table public.study_rooms is
  'Temporary public or verified-university study rooms with server-timed Pomodoro state.';
comment on table public.study_room_members is
  'Current room membership and pseudonymous display snapshots; deleted when members leave or rooms end.';
comment on table public.study_room_messages is
  'Room-scoped chat retained only for the life of its temporary study room.';
