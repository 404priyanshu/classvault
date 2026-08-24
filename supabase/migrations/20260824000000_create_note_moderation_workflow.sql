-- Secure report intake and scoped moderation workflow.

create or replace function public.report_note(
  p_note_id uuid,
  p_category text,
  p_details text default null
)
returns table (
  report_id uuid,
  error_code text,
  success boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  note_record public.notes%rowtype;
  normalized_category text := lower(trim(coalesce(p_category, '')));
  normalized_details text := nullif(trim(coalesce(p_details, '')), '');
  created_report_id uuid;
begin
  if current_user_id is null then
    return query select null::uuid, 'unauthenticated'::text, false;
    return;
  end if;

  if normalized_category not in (
    'copyright', 'unsafe_file', 'wrong_scope', 'misleading',
    'harassment', 'spam', 'other'
  ) then
    return query select null::uuid, 'invalid_category'::text, false;
    return;
  end if;

  if normalized_details is not null and char_length(normalized_details) > 2000 then
    return query select null::uuid, 'details_too_long'::text, false;
    return;
  end if;

  select *
  into note_record
  from public.notes as note
  where note.id = p_note_id;

  if not found
    or note_record.publication_status <> 'published'
    or note_record.deleted_at is not null
    or note_record.moderation_status not in ('clear', 'under_review')
    or not public.can_consume_note(note_record.id) then
    return query select null::uuid, 'not_permitted'::text, false;
    return;
  end if;

  if note_record.owner_id = current_user_id then
    return query select null::uuid, 'self_report_forbidden'::text, false;
    return;
  end if;

  if exists (
    select 1
    from public.note_reports as report
    where report.note_id = p_note_id
      and report.reporter_id = current_user_id
      and report.status in ('open', 'reviewing')
  ) then
    return query select null::uuid, 'already_reported'::text, false;
    return;
  end if;

  insert into public.note_reports (note_id, reporter_id, category, details)
  values (p_note_id, current_user_id, normalized_category, normalized_details)
  returning id into created_report_id;

  return query select created_report_id, null::text, true;
exception
  when unique_violation then
    return query select null::uuid, 'already_reported'::text, false;
end;
$$;

create or replace function public.moderate_note(
  p_note_id uuid,
  p_action text,
  p_reason_code text,
  p_safe_owner_message text default null
)
returns table (
  error_code text,
  moderation_status text,
  note_id uuid,
  success boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  note_record public.notes%rowtype;
  normalized_action text := lower(trim(coalesce(p_action, '')));
  normalized_reason text := trim(coalesce(p_reason_code, ''));
  normalized_message text := nullif(trim(coalesce(p_safe_owner_message, '')), '');
  next_status text;
  next_hold boolean;
  resolved_report_status text;
begin
  if current_user_id is null then
    return query select 'unauthenticated'::text, null::text, null::uuid, false;
    return;
  end if;

  if normalized_action not in (
    'start_review', 'clear_review', 'restrict', 'restore', 'remove',
    'hold', 'release_hold'
  ) then
    return query select 'invalid_action'::text, null::text, p_note_id, false;
    return;
  end if;

  if char_length(normalized_reason) < 2 or char_length(normalized_reason) > 80 then
    return query select 'invalid_reason'::text, null::text, p_note_id, false;
    return;
  end if;

  if normalized_message is not null and char_length(normalized_message) > 1000 then
    return query select 'message_too_long'::text, null::text, p_note_id, false;
    return;
  end if;

  select *
  into note_record
  from public.notes as note
  where note.id = p_note_id
  for update;

  if not found or not public.can_moderate_note(p_note_id) then
    return query select 'not_permitted'::text, null::text, p_note_id, false;
    return;
  end if;

  next_status := note_record.moderation_status;
  next_hold := note_record.retention_hold;
  resolved_report_status := null;

  case normalized_action
    when 'start_review' then
      if note_record.moderation_status not in ('clear', 'under_review') then
        return query select 'invalid_transition', note_record.moderation_status, p_note_id, false;
        return;
      end if;
      next_status := 'under_review';
    when 'clear_review' then
      if note_record.moderation_status <> 'under_review' then
        return query select 'invalid_transition', note_record.moderation_status, p_note_id, false;
        return;
      end if;
      next_status := 'clear';
      resolved_report_status := 'dismissed';
    when 'restrict' then
      if note_record.moderation_status not in ('clear', 'under_review') then
        return query select 'invalid_transition', note_record.moderation_status, p_note_id, false;
        return;
      end if;
      next_status := 'restricted';
      resolved_report_status := 'resolved';
    when 'remove' then
      if note_record.moderation_status not in ('clear', 'under_review', 'restricted') then
        return query select 'invalid_transition', note_record.moderation_status, p_note_id, false;
        return;
      end if;
      next_status := 'removed';
      resolved_report_status := 'resolved';
    when 'restore' then
      if note_record.moderation_status not in ('restricted', 'removed', 'under_review') then
        return query select 'invalid_transition', note_record.moderation_status, p_note_id, false;
        return;
      end if;
      next_status := 'clear';
    when 'hold' then
      next_hold := true;
    when 'release_hold' then
      next_hold := false;
  end case;

  update public.notes
  set moderation_status = next_status,
      retention_hold = next_hold
  where id = p_note_id;

  insert into public.note_moderation_actions (
    note_id,
    actor_id,
    action,
    reason_code,
    safe_owner_message
  )
  values (
    p_note_id,
    current_user_id,
    normalized_action,
    normalized_reason,
    normalized_message
  );

  if normalized_action = 'start_review' then
    update public.note_reports
    set status = 'reviewing'
    where note_id = p_note_id
      and status = 'open';
  elsif resolved_report_status is not null then
    update public.note_reports
    set status = resolved_report_status,
        resolved_at = now()
    where note_id = p_note_id
      and status in ('open', 'reviewing');
  end if;

  return query select null::text, next_status, p_note_id, true;
end;
$$;

create or replace function public.list_moderation_queue(p_limit integer default 50)
returns table (
  category text,
  created_at timestamptz,
  details text,
  note_id uuid,
  note_title text,
  note_visibility text,
  moderation_status text,
  report_id uuid,
  report_status text,
  reporter_label text,
  owner_label text,
  university_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    report.category,
    report.created_at,
    report.details,
    note.id,
    note.title,
    note.visibility,
    note.moderation_status,
    report.id,
    report.status,
    coalesce(reporter.display_name, 'ClassVault student'),
    coalesce(owner_profile.display_name, 'ClassVault student'),
    university.name
  from public.note_reports as report
  join public.notes as note on note.id = report.note_id
  join public.profiles as reporter on reporter.id = report.reporter_id
  join public.profiles as owner_profile on owner_profile.id = note.owner_id
  left join public.universities as university on university.id = note.university_id
  where report.status in ('open', 'reviewing')
    and public.can_moderate_note(note.id)
  order by report.created_at asc, report.id asc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

create or replace function public.list_owned_note_moderation_notices()
returns table (
  action text,
  created_at timestamptz,
  moderation_status text,
  note_id uuid,
  note_title text,
  safe_owner_message text
)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct on (note.id)
    action.action,
    action.created_at,
    note.moderation_status,
    note.id,
    note.title,
    action.safe_owner_message
  from public.notes as note
  join public.note_moderation_actions as action on action.note_id = note.id
  where note.owner_id = (select auth.uid())
    and action.safe_owner_message is not null
  order by note.id, action.created_at desc, action.id desc;
$$;

revoke all on function public.report_note(uuid, text, text) from public, anon;
revoke all on function public.moderate_note(uuid, text, text, text) from public, anon;
revoke all on function public.list_moderation_queue(integer) from public, anon;
revoke all on function public.list_owned_note_moderation_notices() from public, anon;

grant execute on function public.report_note(uuid, text, text) to authenticated;
grant execute on function public.moderate_note(uuid, text, text, text) to authenticated;
grant execute on function public.list_moderation_queue(integer) to authenticated;
grant execute on function public.list_owned_note_moderation_notices() to authenticated;
