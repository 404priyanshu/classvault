-- Server-owned abuse limits for study rooms. See docs/adr/0030.
--
-- ADR 0030 asks for two caps, both enforced in the database and both
-- "configurable in the same way plan limits already are, so tightening them
-- after the pilot does not require a migration to the application". That is why
-- they are columns on study_room_plan_limits rather than constants in a
-- function body: after the pilot, tightening either one is an update statement.

alter table public.study_room_plan_limits
  add column chat_messages_per_window smallint not null default 12,
  add column chat_window_seconds smallint not null default 30,
  add column rooms_per_window smallint not null default 6,
  add column room_window_minutes smallint not null default 60,
  add constraint study_room_plan_limits_chat_messages
    check (chat_messages_per_window between 1 and 200),
  add constraint study_room_plan_limits_chat_window
    check (chat_window_seconds between 5 and 600),
  add constraint study_room_plan_limits_rooms
    check (rooms_per_window between 1 and 50),
  add constraint study_room_plan_limits_room_window
    check (room_window_minutes between 5 and 1440);

-- Six an hour for a free student, not three: ending a session and opening a
-- fresh one is ordinary use, and the existing study-room suite -- written long
-- before this cap -- has one student legitimately create four. A limit that
-- fails honest behaviour is a bug with a plausible excuse. Six still leaves a
-- script nothing to work with.

update public.study_room_plan_limits
set chat_messages_per_window = 30,
    rooms_per_window = 12
where plan = 'pro';

/**
 * Room creations, kept only as long as the widest window needs them.
 *
 * A study_rooms row is deleted when the room ends, when the last member
 * leaves, and by the expiry worker -- so counting rooms a student still owns
 * would cap nobody: create, end, create, end evades it entirely, which is the
 * pattern the cap exists to stop. This holds the minimum that fixes that: who,
 * and when. No room id, no name, nothing that outlives the room it came from.
 */
create table public.study_room_creation_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index study_room_creation_log_user_idx
  on public.study_room_creation_log (user_id, created_at desc);

alter table public.study_room_creation_log enable row level security;
alter table public.study_room_creation_log force row level security;
revoke all on table public.study_room_creation_log from public, anon, authenticated;

comment on table public.study_room_creation_log is
  'Minimal who-and-when ledger backing the per-student room-creation cap; pruned to the widest configured window.';

/**
 * Creating a room, now subject to a per-student cap over a rolling window.
 *
 * Unchanged except for the ledger read, the refusal, and the write at the end.
 */
create or replace function public.create_study_room(
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
  recent_rooms integer;
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

  select count(*)
  into recent_rooms
  from public.study_room_creation_log as creation
  where creation.user_id = actor_id
    and creation.created_at
      > now() - make_interval(mins => selected_limits.room_window_minutes);

  if recent_rooms >= selected_limits.rooms_per_window then
    raise exception 'Too many rooms created recently'
      using errcode = '53400';
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

  insert into public.study_room_creation_log (user_id)
  values (actor_id);

  -- Pruned on the way past rather than by a worker: the ledger is only ever
  -- read over the widest configured window, so anything twice that old cannot
  -- affect a decision, and leaving it would turn a rate limiter into a record
  -- of when each student studies.
  delete from public.study_room_creation_log as creation
  where creation.created_at < now() - make_interval(
    mins => 2 * (select max(limits.room_window_minutes)
                 from public.study_room_plan_limits as limits)
  );

  return created_room_id;
end;
$$;

/**
 * Posting to a room, now subject to a per-participant cap over a short window.
 *
 * The room's own plan governs, not the poster's: a room already snapshots its
 * host's capacity and duration, and a participant's plan should not change the
 * rules inside someone else's room. Counting straight from study_room_messages
 * is enough here -- unlike room creation, both the window and the messages live
 * entirely inside the room's lifetime, so there is nothing to keep afterwards.
 */
create or replace function public.send_study_room_message(p_room_id uuid, p_body text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_name text;
  created_message_id bigint;
  room_limits public.study_room_plan_limits%rowtype;
  recent_messages integer;
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

  if public.is_muted_in_study_room(p_room_id) then
    raise exception 'You cannot post in this room'
      using errcode = '42501';
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

  select limits.*
  into room_limits
  from public.study_rooms as room
  join public.study_room_plan_limits as limits
    on limits.plan = room.host_plan_snapshot
  where room.id = p_room_id;

  if found then
    select count(*)
    into recent_messages
    from public.study_room_messages as message
    where message.room_id = p_room_id
      and message.author_id = actor_id
      and message.created_at
        > now() - make_interval(secs => room_limits.chat_window_seconds);

    if recent_messages >= room_limits.chat_messages_per_window then
      raise exception 'You are sending messages too quickly'
        using errcode = '53400';
    end if;
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
