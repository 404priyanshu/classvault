-- Qualify report columns that conflict with moderate_note output parameters.

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
#variable_conflict error
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

  select note.*
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

  update public.notes as note
  set moderation_status = next_status,
      retention_hold = next_hold
  where note.id = p_note_id;

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
    update public.note_reports as report
    set status = 'reviewing'
    where report.note_id = p_note_id
      and report.status = 'open';
  elsif resolved_report_status is not null then
    update public.note_reports as report
    set status = resolved_report_status,
        resolved_at = now()
    where report.note_id = p_note_id
      and report.status in ('open', 'reviewing');
  end if;

  return query select null::text, next_status, p_note_id, true;
end;
$$;

revoke all on function public.moderate_note(uuid, text, text, text)
  from public, anon;
grant execute on function public.moderate_note(uuid, text, text, text)
  to authenticated;

comment on function public.moderate_note(uuid, text, text, text) is
  'Applies scoped, audited moderation transitions and updates active reports.';
