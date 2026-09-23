-- Transactional pgTAP coverage for the demand-pilot usage ledger.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(14);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000', 'abababab-0000-4000-8000-00000000e001',
    'authenticated', 'authenticated', 'counted@example.com', '', now(), '{}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000', 'abababab-0000-4000-8000-00000000e002',
    'authenticated', 'authenticated', 'other@example.com', '', now(), '{}', '{}', now(), now()
  );

insert into public.notes (
  id, owner_id, subject_id, visibility, university_id, title, description,
  note_type, publication_status, published_at
)
values (
  'abababab-0000-4000-8000-0000000000f1',
  'abababab-0000-4000-8000-00000000e002',
  (select id from public.subjects where slug = 'data-structures'),
  'public', null, 'Usage fixture note', 'A note opened by the usage tests.',
  'summary', 'published', now()
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.usage_events', 'SELECT'),
  'students cannot read the usage ledger'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.usage_events', 'INSERT'),
  'students cannot write the usage ledger directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.usage_daily_summary', 'SELECT')
    and not has_table_privilege('authenticated', 'public.usage_weekly_students', 'SELECT'),
  'students cannot read the usage summaries'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.record_usage_event(text, uuid, boolean)', 'EXECUTE'),
  'anonymous visitors cannot record usage'
);
select extensions.ok(
  has_table_privilege('service_role', 'public.usage_daily_summary', 'SELECT'),
  'the operator can read the daily summary with the service role'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000e001', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000e001","role":"authenticated"}', true);

select extensions.ok(
  public.record_usage_event('notes_searched', null, false),
  'a search is recorded with its outcome'
);
select extensions.ok(
  public.record_usage_event('study_room_joined'),
  'an event without a note is recorded'
);
select extensions.throws_ok(
  $$select public.record_usage_event('notes_searched')$$,
  '23514',
  null,
  'a search must say whether it found anything'
);
select extensions.throws_ok(
  $$select public.record_usage_event('page_viewed')$$,
  '23514',
  null,
  'unknown events are refused'
);
select extensions.throws_ok(
  $$select public.record_usage_event('roadmap_generated', gen_random_uuid())$$,
  '23514',
  null,
  'only note events may name a note'
);

select extensions.ok(
  public.record_usage_event('note_opened', 'abababab-0000-4000-8000-0000000000f1'),
  'the first open of a note is recorded'
);
select extensions.ok(
  not public.record_usage_event('note_opened', 'abababab-0000-4000-8000-0000000000f1'),
  'a repeat open within ten minutes is dropped'
);
select extensions.ok(
  public.record_usage_event('note_downloaded', 'abababab-0000-4000-8000-0000000000f1'),
  'a download straight after an open is still recorded'
);

reset role;

select extensions.is(
  (select array_agg(distinct user_id) from public.usage_events
   where note_id = 'abababab-0000-4000-8000-0000000000f1'),
  array['abababab-0000-4000-8000-00000000e001'::uuid],
  'events are attributed to the caller, never to a supplied user'
);

select * from extensions.finish();
rollback;
