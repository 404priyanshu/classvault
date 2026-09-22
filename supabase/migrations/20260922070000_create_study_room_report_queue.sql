-- A reviewer surface for study-room reports. See docs/adr/0030.
--
-- The reports have been filed and stored since 20260922050000 with nobody able
-- to read them: the tables are revoked from `authenticated` and no definer
-- function exposed them. A report nobody reads is worse than no report at all,
-- because the student who filed it believes someone is looking.

-- Who reviewed, and what they concluded. Mirrors membership_verification_requests,
-- which records the same three things for the same reason.
alter table public.study_room_reports
  add column reviewer_id uuid references public.profiles (id) on delete set null,
  add column reviewed_at timestamptz,
  add column review_note text not null default ''
    check (char_length(review_note) <= 1000);

/**
 * The platform moderator's queue of open study-room reports.
 *
 * Shows labels, never ids -- the same rule the note queue follows, for the same
 * reason: a moderator reviews what happened, not who it happened to. The cited
 * messages travel with the report because the room's chat is deleted when the
 * room ends, and `room_still_live` says whether there is still a room to look
 * at, which for a temporary room is usually no by the time anyone reviews it.
 */
create function public.list_study_room_reports(p_limit integer default 100)
returns table (
  report_id uuid,
  room_name text,
  room_still_live boolean,
  category text,
  details text,
  status text,
  created_at timestamptz,
  reported_label text,
  reported_suspended boolean,
  reporter_label text,
  reviewer_label text,
  reviewed_at timestamptz,
  review_note text,
  cited_messages jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    report.id,
    report.room_name_snapshot,
    exists (select 1 from public.study_rooms as room where room.id = report.room_id),
    report.category,
    report.details,
    report.status,
    report.created_at,
    coalesce(reported.display_name, 'ClassVault student'),
    reported.suspended_at is not null,
    coalesce(reporter.display_name, 'ClassVault student'),
    reviewer.display_name,
    report.reviewed_at,
    report.review_note,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', cited.position,
        'authorDisplayName', cited.author_display_name,
        'body', cited.body,
        'sentAt', cited.sent_at
      ) order by cited.position)
      from public.study_room_report_messages as cited
      where cited.report_id = report.id
    ), '[]'::jsonb)
  from public.study_room_reports as report
  join public.profiles as reported on reported.id = report.reported_user_id
  join public.profiles as reporter on reporter.id = report.reporter_id
  left join public.profiles as reviewer on reviewer.id = report.reviewer_id
  where report.status in ('open', 'reviewing')
    and public.has_platform_notes_role(
      array['platform_moderator', 'platform_admin']::text[]
    )
  order by report.created_at asc, report.id asc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

/**
 * Moves a report through review, recording who moved it and why.
 *
 * Closing is the only way a report leaves the queue, so the note is required
 * for it: a report that vanishes with no account of what was decided leaves the
 * next reviewer guessing whether anyone looked.
 */
create function public.set_study_room_report_status(
  p_report_id uuid,
  p_status text,
  p_review_note text default ''
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewing_user uuid := (select auth.uid());
  trimmed_note text := btrim(coalesce(p_review_note, ''));
begin
  if reviewing_user is null then
    return false;
  end if;

  if p_status not in ('reviewing', 'closed') then
    return false;
  end if;

  if p_status = 'closed' and trimmed_note = '' then
    return false;
  end if;

  if char_length(trimmed_note) > 1000 then
    return false;
  end if;

  if not public.has_platform_notes_role(
    array['platform_moderator', 'platform_admin']::text[]
  ) then
    return false;
  end if;

  update public.study_room_reports as report
  set status = p_status,
      review_note = trimmed_note,
      reviewer_id = reviewing_user,
      reviewed_at = now()
  where report.id = p_report_id
    and report.status in ('open', 'reviewing');

  return found;
end;
$$;

/**
 * Suspends the account a report names, without the caller handling its id.
 *
 * The same shape as suspend_note_owner, and for the same reason: the queue
 * shows a label, suspension is administrator-only, and an id in the queue would
 * be an identifier every moderator could read and none could use.
 */
create function public.suspend_study_room_reported_user(
  p_report_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
begin
  if not public.has_platform_notes_role(array['platform_admin']) then
    return false;
  end if;

  select report.reported_user_id into target_user
  from public.study_room_reports as report
  where report.id = p_report_id;

  if not found then
    return false;
  end if;

  return public.set_account_suspension(target_user, true, p_reason);
end;
$$;

revoke all on function public.list_study_room_reports(integer) from public, anon;
revoke all on function public.set_study_room_report_status(uuid, text, text) from public, anon;
revoke all on function public.suspend_study_room_reported_user(uuid, text) from public, anon;

grant execute on function public.list_study_room_reports(integer) to authenticated;
grant execute on function public.set_study_room_report_status(uuid, text, text) to authenticated;
grant execute on function public.suspend_study_room_reported_user(uuid, text) to authenticated;

comment on function public.list_study_room_reports(integer) is
  'Platform-moderator queue of open study-room reports, with the messages each one cited.';
comment on function public.set_study_room_report_status(uuid, text, text) is
  'Records a study-room report as under review or closed, with the reviewer and their note.';
comment on function public.suspend_study_room_reported_user(uuid, text) is
  'Platform-admin-only suspension of a reported participant, keeping ids out of the queue.';
