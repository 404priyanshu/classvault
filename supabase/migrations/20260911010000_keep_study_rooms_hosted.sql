-- Stop study rooms losing their host.

-- Two defects, one visible and one not.
--
-- `join_study_room` inserted every arrival on the column default, `member`. A
-- student who created a room, left, and came back returned as an ordinary
-- member: no crown, no timer, no way to end the room they had opened. The
-- room still recorded them in `created_by`; joining simply never looked.
--
-- `leave_study_room` promoted a departing host's replacement only from among
-- cohosts. Most rooms never appoint one, so a host leaving an occupied room
-- left nobody in charge -- the timer could not be started, paused, or reset,
-- and the room could not be ended, by anyone. It sat there until `ends_at`
-- passed. Nothing surfaced this, because a room with no host looks exactly
-- like a room whose host is idle.

/**
 * Hands a departing host's room to whoever is best placed to run it.
 *
 * Cohosts first, since being appointed one is what that means, and then the
 * longest-standing member. Both by arrival, so the choice is the person most
 * likely to still be there rather than the newest tab.
 */
create or replace function public.leave_study_room(p_room_id uuid)
returns table(room_deleted boolean, new_host_id uuid)
language plpgsql
security definer
set search_path to ''
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
    order by
      case member.role when 'cohost' then 0 else 1 end,
      member.joined_at,
      member.user_id
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

/**
 * Gives a returning creator their room back, but only if nobody else has it.
 *
 * Leaving hands the room to whoever stayed, and that promotion is real -- the
 * person running the timer for the last twenty minutes does not get silently
 * demoted because the original creator reopened the tab. So the crown comes
 * back only when the room has no host at all, which is exactly the case where
 * returning is the room's best outcome.
 */
create or replace function public.join_study_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
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
