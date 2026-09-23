-- First-party usage counts for the demand pilot. See AGENTS.md section 10.
--
-- The question this answers is narrow: do students search, open, download, and
-- upload notes, and do they come back? It needs who (to count distinct and
-- returning students), what, and when -- nothing else. No search text, no
-- page URLs, no device or network details. Choosing a third-party analytics
-- provider is still an open decision; this keeps the data in our own database
-- until one is made.

create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  event text not null,
  note_id uuid references public.notes (id) on delete set null,
  found_results boolean,
  occurred_at timestamptz not null default now(),
  constraint usage_events_event check (
    event in (
      'notes_searched',
      'note_opened',
      'note_downloaded',
      'note_uploaded',
      'roadmap_generated',
      'study_room_joined'
    )
  ),
  -- Only a search has an outcome worth counting; only note events name a note.
  constraint usage_events_found_results check (
    (event = 'notes_searched') = (found_results is not null)
  ),
  constraint usage_events_note check (
    note_id is null
    or event in ('note_opened', 'note_downloaded', 'note_uploaded')
  )
);

create index usage_events_occurred_idx
  on public.usage_events (occurred_at desc);
create index usage_events_user_event_idx
  on public.usage_events (user_id, event, occurred_at desc);

alter table public.usage_events enable row level security;
alter table public.usage_events force row level security;
revoke all on table public.usage_events from public, anon, authenticated;

comment on table public.usage_events is
  'Minimal who-what-when ledger for the demand pilot. No search text or request details. Written only through record_usage_event.';

/**
 * Records one usage event for the calling student.
 *
 * The actor is always auth.uid(); the browser never names a user. A repeat
 * note_opened for the same note within ten minutes is dropped, because a
 * detail page re-renders after a rating or report and that is not a second
 * visit. Returns whether a row was written.
 */
create or replace function public.record_usage_event(
  p_event text,
  p_note_id uuid default null,
  p_found_results boolean default null
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
      using errcode = '42501';
  end if;

  if p_event = 'note_opened' and exists (
    select 1
    from public.usage_events as recent
    where recent.user_id = actor_id
      and recent.event = 'note_opened'
      and recent.note_id = p_note_id
      and recent.occurred_at > now() - interval '10 minutes'
  ) then
    return false;
  end if;

  insert into public.usage_events (user_id, event, note_id, found_results)
  values (actor_id, p_event, p_note_id, p_found_results);

  return true;
end;
$$;

revoke all on function public.record_usage_event(text, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.record_usage_event(text, uuid, boolean)
  to authenticated;

/**
 * Daily totals per event, for the operator. Counts and distinct students only:
 * nothing here identifies anyone. Read it from the SQL editor or with the
 * service role; students cannot.
 */
create view public.usage_daily_summary
with (security_invoker = true)
as
select
  (events.occurred_at at time zone 'Asia/Kolkata')::date as day,
  events.event,
  count(*) as events,
  count(distinct events.user_id) as students,
  count(*) filter (where events.found_results = false) as searches_without_results
from public.usage_events as events
group by 1, 2;

/**
 * Weekly active and returning students. "Returning" means active this week
 * and in some earlier week -- the number that says whether the pilot stuck.
 */
create view public.usage_weekly_students
with (security_invoker = true)
as
with weekly as (
  select distinct
    date_trunc('week', events.occurred_at at time zone 'Asia/Kolkata')::date as week,
    events.user_id
  from public.usage_events as events
)
select
  weekly.week,
  count(*) as active_students,
  count(*) filter (
    where exists (
      select 1 from weekly as earlier
      where earlier.user_id = weekly.user_id
        and earlier.week < weekly.week
    )
  ) as returning_students
from weekly
group by weekly.week;

revoke all on table public.usage_daily_summary from public, anon, authenticated;
revoke all on table public.usage_weekly_students from public, anon, authenticated;
grant select on table public.usage_events to service_role;
grant select on table public.usage_daily_summary to service_role;
grant select on table public.usage_weekly_students to service_role;
