-- Makes a room's mutes visible to the people who need them. See docs/adr/0030.
--
-- The abuse controls shipped without a way to read their result: a host had no
-- way to see who they had muted (so no way to offer "unmute"), and a muted
-- student had no way to learn they were muted except by writing a message and
-- being refused. Both facts already exist in study_room_restrictions, which is
-- revoked from `authenticated` and reachable only through a definer function.
-- The snapshot is that function.

/**
 * Adds mute state to the room snapshot.
 *
 * `viewerMuted` is the caller's own, always. `mutedUserIds` is empty unless the
 * caller may act on it: a mute is a moderation fact, and a room that shows
 * everyone who is silenced turns a control into a public label.
 */
create or replace function public.get_study_room_snapshot(p_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  -- Not named actor_id: study_room_restrictions has a column by that name,
  -- and an unqualified reference inside the subqueries below would be
  -- ambiguous between the variable and the column.
  viewer_id uuid := (select auth.uid());
  snapshot jsonb;
begin
  if viewer_id is null or not public.is_study_room_member(p_room_id) then
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
    'viewerMuted', exists (
      select 1
      from public.study_room_restrictions as restriction
      where restriction.room_id = room.id
        and restriction.user_id = viewer_id
        and restriction.kind = 'muted'
    ),
    'mutedUserIds', case
      when viewer.role in ('host', 'cohost') then coalesce((
        select jsonb_agg(restriction.user_id order by restriction.created_at)
        from public.study_room_restrictions as restriction
        where restriction.room_id = room.id
          and restriction.kind = 'muted'
      ), '[]'::jsonb)
      else '[]'::jsonb
    end,
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
   and viewer.user_id = viewer_id
  left join public.universities as university on university.id = room.university_id
  where room.id = p_room_id;

  return snapshot;
end;
$$;

/**
 * Withdraws or restores a participant's ability to post in a room's chat.
 *
 * Unchanged except for the touch at the end: see the comment there.
 */
create or replace function public.set_study_room_mute(
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

  -- Deliberately writes a row version without changing a value.
  --
  -- study_room_restrictions is revoked from `authenticated`, so realtime cannot
  -- deliver a mute to the person it silences; study_room_members can be read by
  -- the room and the page already re-renders on its changes. Touching the row
  -- is what makes a mute reach the muted student's composer while they are
  -- still typing into it, instead of when they next press send. Removing this
  -- statement silently costs that, which is why it is not dead code.
  update public.study_room_members as member
  set role = member.role
  where member.room_id = p_room_id
    and member.user_id = p_user_id;

  return true;
end;
$$;
