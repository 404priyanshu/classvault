-- Study-room abuse controls, scoped to the room. See docs/adr/0030.

-- Removal and muting last exactly as long as the room does, so neither needs a
-- lifted/expired concept: the rows die with the room. Consequences that follow
-- a student across ClassVault stay account suspension under ADR 0011.

-- Current restrictions. Doubles as the rejoin block-list, which is why a
-- removal has to survive the membership row being deleted.
create table public.study_room_restrictions (
  room_id uuid not null references public.study_rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('removed', 'muted')),
  actor_id uuid references public.profiles (id) on delete set null,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now(),
  primary key (room_id, user_id, kind)
);

-- Append-only: unmuting deletes the restriction row, so without this the fact
-- that a mute ever happened would vanish.
create table public.study_room_moderation_actions (
  id bigint generated always as identity primary key,
  room_id uuid not null,
  target_user_id uuid not null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('removed', 'muted', 'unmuted')),
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index study_room_moderation_actions_room_idx
  on public.study_room_moderation_actions (room_id, created_at desc);

create table public.study_room_reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  room_name_snapshot text not null,
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (
    category in ('harassment', 'spam', 'hate_speech', 'sexual_content', 'other')
  ),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

create index study_room_reports_open_idx
  on public.study_room_reports (status, created_at desc);

-- The narrowing of ADR 0005: a report copies the messages it cites, at filing
-- time, because the room's chat is deleted when the room ends and a reviewer
-- would otherwise have nothing to look at. Nothing around them is kept.
create table public.study_room_report_messages (
  report_id uuid not null references public.study_room_reports (id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  author_display_name text not null,
  body text not null check (char_length(body) <= 1000),
  sent_at timestamptz not null,
  primary key (report_id, position)
);

alter table public.study_room_restrictions enable row level security;
alter table public.study_room_restrictions force row level security;
alter table public.study_room_moderation_actions enable row level security;
alter table public.study_room_moderation_actions force row level security;
alter table public.study_room_reports enable row level security;
alter table public.study_room_reports force row level security;
alter table public.study_room_report_messages enable row level security;
alter table public.study_room_report_messages force row level security;

revoke all on table public.study_room_restrictions from public, anon, authenticated;
revoke all on table public.study_room_moderation_actions from public, anon, authenticated;
revoke all on table public.study_room_reports from public, anon, authenticated;
revoke all on table public.study_room_report_messages from public, anon, authenticated;

/** Whether the calling student is muted in a room. */
create function public.is_muted_in_study_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.study_room_restrictions as restriction
    where restriction.room_id = p_room_id
      and restriction.user_id = (select auth.uid())
      and restriction.kind = 'muted'
  );
$$;

/**
 * Whether the caller may use host controls in a room.
 *
 * Hosts and co-hosts both qualify: appointing a co-host is what that means.
 */
create function public.can_control_study_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.study_room_members as member
    join public.study_rooms as room on room.id = member.room_id
    where member.room_id = p_room_id
      and member.user_id = (select auth.uid())
      and member.role in ('host', 'cohost')
      and room.ends_at > now()
  );
$$;

/**
 * Removes a participant from a room and blocks them rejoining it.
 *
 * Refuses when the target is a platform moderator or administrator, so a
 * hostile host cannot eject the person reviewing them, and when the target
 * holds host or co-host themselves — a co-host cannot remove the host, and
 * rank disputes are not a moderation tool.
 */
create function public.remove_study_room_member(
  p_room_id uuid,
  p_user_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user uuid := (select auth.uid());
  trimmed_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  target_role text;
begin
  if acting_user is null or p_user_id = acting_user then
    return false;
  end if;

  if trimmed_reason is null or char_length(trimmed_reason) > 500 then
    return false;
  end if;

  if not public.can_control_study_room(p_room_id) then
    return false;
  end if;

  if exists (
    select 1
    from public.platform_roles as assignment
    where assignment.user_id = p_user_id
      and assignment.role in ('platform_moderator', 'platform_admin')
  ) then
    return false;
  end if;

  select member.role into target_role
  from public.study_room_members as member
  where member.room_id = p_room_id
    and member.user_id = p_user_id
  for update;

  if not found or target_role in ('host', 'cohost') then
    return false;
  end if;

  delete from public.study_room_members as member
  where member.room_id = p_room_id
    and member.user_id = p_user_id;

  insert into public.study_room_restrictions (room_id, user_id, kind, actor_id, reason)
  values (p_room_id, p_user_id, 'removed', acting_user, trimmed_reason)
  on conflict (room_id, user_id, kind) do nothing;

  insert into public.study_room_moderation_actions (
    room_id, target_user_id, actor_id, action, reason
  )
  values (p_room_id, p_user_id, acting_user, 'removed', trimmed_reason);

  return true;
end;
$$;

/** Withdraws or restores a participant's ability to post in a room's chat. */
create function public.set_study_room_mute(
  p_room_id uuid,
  p_user_id uuid,
  p_muted boolean,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user uuid := (select auth.uid());
  trimmed_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  target_role text;
begin
  if acting_user is null or p_user_id = acting_user then
    return false;
  end if;

  if trimmed_reason is null or char_length(trimmed_reason) > 500 then
    return false;
  end if;

  if not public.can_control_study_room(p_room_id) then
    return false;
  end if;

  if exists (
    select 1
    from public.platform_roles as assignment
    where assignment.user_id = p_user_id
      and assignment.role in ('platform_moderator', 'platform_admin')
  ) then
    return false;
  end if;

  select member.role into target_role
  from public.study_room_members as member
  where member.room_id = p_room_id
    and member.user_id = p_user_id
  for update;

  if not found or target_role in ('host', 'cohost') then
    return false;
  end if;

  if coalesce(p_muted, false) then
    insert into public.study_room_restrictions (room_id, user_id, kind, actor_id, reason)
    values (p_room_id, p_user_id, 'muted', acting_user, trimmed_reason)
    on conflict (room_id, user_id, kind) do nothing;
  else
    delete from public.study_room_restrictions as restriction
    where restriction.room_id = p_room_id
      and restriction.user_id = p_user_id
      and restriction.kind = 'muted';
  end if;

  insert into public.study_room_moderation_actions (
    room_id, target_user_id, actor_id, action, reason
  )
  values (
    p_room_id,
    p_user_id,
    acting_user,
    case when p_muted then 'muted' else 'unmuted' end,
    trimmed_reason
  );

  return true;
end;
$$;

/**
 * Reports a participant to platform moderators.
 *
 * Not to the host: the host is sometimes the problem, and a public room mixes
 * campuses in a way that makes campus-scoped review the wrong boundary.
 *
 * `p_message_ids` names messages from this room to copy into the report. Ids
 * the reporter cannot see, or that belong to someone else, are ignored rather
 * than rejected, so the call cannot be used to probe for message ids.
 */
create function public.report_study_room_participant(
  p_room_id uuid,
  p_user_id uuid,
  p_category text,
  p_details text default '',
  p_message_ids bigint[] default '{}'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user uuid := (select auth.uid());
  created_report_id uuid;
  room_name text;
begin
  if acting_user is null or p_user_id = acting_user then
    return false;
  end if;

  if p_category not in ('harassment', 'spam', 'hate_speech', 'sexual_content', 'other') then
    return false;
  end if;

  if not public.is_study_room_member(p_room_id) then
    return false;
  end if;

  select room.name into room_name
  from public.study_rooms as room
  where room.id = p_room_id;

  if not found then
    return false;
  end if;

  -- The reported participant must actually be in the room.
  if not exists (
    select 1
    from public.study_room_members as member
    where member.room_id = p_room_id
      and member.user_id = p_user_id
  ) then
    return false;
  end if;

  insert into public.study_room_reports (
    room_id, room_name_snapshot, reported_user_id, reporter_id, category, details
  )
  values (
    p_room_id,
    room_name,
    p_user_id,
    acting_user,
    p_category,
    left(coalesce(p_details, ''), 1000)
  )
  returning id into created_report_id;

  insert into public.study_room_report_messages (
    report_id, position, author_display_name, body, sent_at
  )
  select
    created_report_id,
    (row_number() over (order by message.created_at, message.id))::smallint,
    message.author_display_name,
    message.body,
    message.created_at
  from public.study_room_messages as message
  where message.room_id = p_room_id
    and message.author_id = p_user_id
    and message.id = any(coalesce(p_message_ids, '{}'))
  order by message.created_at, message.id
  limit 10;

  return true;
end;
$$;

-- Joining must respect a removal and posting must respect a mute. Both are
-- rechecked in the database rather than hidden in the client.
create or replace function public.join_study_room(p_room_id uuid)
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
  joined_role text := 'member';
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

  -- A removal blocks rejoining for the room's remaining lifetime, and reads
  -- exactly like any other loss of access so it reveals nothing extra.
  if exists (
    select 1
    from public.study_room_restrictions as restriction
    where restriction.room_id = p_room_id
      and restriction.user_id = (select auth.uid())
      and restriction.kind = 'removed'
  ) then
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

  if selected_room.created_by = actor_id
    and not exists (
      select 1
      from public.study_room_members as member
      where member.room_id = p_room_id
        and member.role = 'host'
    ) then
    joined_role := 'host';
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
    role,
    display_name_snapshot,
    avatar_url_snapshot
  )
  values (p_room_id, actor_id, joined_role, actor_name, actor_avatar);

  return true;
end;
$$;

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

revoke all on function public.is_muted_in_study_room(uuid) from public, anon;
revoke all on function public.can_control_study_room(uuid) from public, anon;
revoke all on function public.remove_study_room_member(uuid, uuid, text) from public, anon;
revoke all on function public.set_study_room_mute(uuid, uuid, boolean, text) from public, anon;
revoke all on function public.report_study_room_participant(uuid, uuid, text, text, bigint[])
  from public, anon;

grant execute on function public.is_muted_in_study_room(uuid) to authenticated;
grant execute on function public.can_control_study_room(uuid) to authenticated;
grant execute on function public.remove_study_room_member(uuid, uuid, text) to authenticated;
grant execute on function public.set_study_room_mute(uuid, uuid, boolean, text) to authenticated;
grant execute on function public.report_study_room_participant(uuid, uuid, text, text, bigint[])
  to authenticated;

comment on table public.study_room_restrictions is
  'Room-scoped removals and mutes; rows die with the room they belong to.';
comment on table public.study_room_report_messages is
  'Messages a report cites, copied at filing time because room chat is deleted when the room ends.';
