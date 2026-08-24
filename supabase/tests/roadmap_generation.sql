-- Transactional pgTAP coverage for service-owned roadmap generation claims,
-- private source excerpts, failure transitions, and retries.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(25);

create temp table roadmap_generation_test_state (
  slot text primary key,
  roadmap_id uuid not null,
  claim_status text,
  sources jsonb
);
grant select, insert, update on roadmap_generation_test_state
  to authenticated, service_role;

select extensions.ok(
  not has_function_privilege('authenticated', 'public.claim_roadmap_generation(uuid,uuid,text)', 'EXECUTE'),
  'authenticated users cannot claim generation jobs'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.mark_roadmap_generation_failed(uuid,uuid,text)', 'EXECUTE'),
  'authenticated users cannot write generation failures'
);
select extensions.ok(
  has_function_privilege('service_role', 'public.claim_roadmap_generation(uuid,uuid,text)', 'EXECUTE'),
  'the service worker can claim generation jobs'
);
select extensions.ok(
  has_function_privilege('service_role', 'public.mark_roadmap_generation_failed(uuid,uuid,text)', 'EXECUTE'),
  'the service worker can record generation failures'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '91919191-9191-4191-8191-919191919191', 'authenticated', 'authenticated', 'generation-owner@bennett.edu.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '92929292-9292-4292-8292-929292929292', 'authenticated', 'authenticated', 'generation-outsider@iitd.ac.in', '', now(), '{}', '{}', now(), now());

update public.profiles
set onboarding_completed_at = now()
where id in (
  '91919191-9191-4191-8191-919191919191',
  '92929292-9292-4292-8292-929292929292'
);

insert into public.university_memberships (
  user_id, university_id, academic_email, status, role, verified_at
)
values
  ('91919191-9191-4191-8191-919191919191', (select id from public.universities where slug = 'bennett-university'), 'generation-owner@bennett.edu.in', 'verified', 'student', now()),
  ('92929292-9292-4292-8292-929292929292', (select id from public.universities where slug = 'iit-delhi'), 'generation-outsider@iitd.ac.in', 'verified', 'student', now());

insert into public.notes (
  id, owner_id, subject_id, visibility, title, description, note_type,
  tags, publication_status, published_at
)
values (
  '93939393-9393-4393-8393-939393939393',
  '91919191-9191-4191-8191-919191919191',
  (select id from public.subjects where slug = 'operating-systems' limit 1),
  'public', 'Generation scheduling notes', 'Scheduling source fixture',
  'summary', array['generation'], 'published', now()
);

insert into public.note_assets (
  id, note_id, storage_backend, object_key, original_filename,
  detected_mime_type, byte_size, sha256, processing_status
)
values (
  '94949494-9494-4494-8494-949494949494',
  '93939393-9393-4393-8393-939393939393',
  'supabase_storage',
  'notes/93939393-9393-4393-8393-939393939393/source/94949494-9494-4494-8494-949494949494',
  'generation.pdf', 'application/pdf', 128, repeat('9', 64), 'ready'
);

update public.note_search_documents
set extraction_status = 'ready',
    extracted_text = 'Round robin scheduling uses a rotating ready queue.',
    search_document = to_tsvector('simple', 'Round robin scheduling uses a rotating ready queue.'),
    extractor_version = 'generation-test-v1'
where note_id = '93939393-9393-4393-8393-939393939393';

set local role authenticated;
select set_config('request.jwt.claim.sub', '91919191-9191-4191-8191-919191919191', true);
select set_config('request.jwt.claims', '{"sub":"91919191-9191-4191-8191-919191919191","role":"authenticated"}', true);

insert into roadmap_generation_test_state (slot, roadmap_id)
select 'primary', roadmap_id
from public.create_roadmap_source_snapshot('Operating Systems', 'exam');

select extensions.ok(
  (select roadmap_id is not null from roadmap_generation_test_state where slot = 'primary'),
  'an eligible owner can create the source snapshot before generation'
);

set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

update roadmap_generation_test_state as state
set (claim_status, sources) = (
  select claim.claim_status, claim.sources
  from public.claim_roadmap_generation(
    state.roadmap_id,
    '91919191-9191-4191-8191-919191919191',
    'deterministic-v1'
  ) as claim
)
where state.slot = 'primary';

select extensions.is(
  (select claim_status from roadmap_generation_test_state where slot = 'primary'),
  'claimed',
  'the service worker atomically claims an owner roadmap'
);
select extensions.is(
  (select status from public.study_roadmaps where id = (select roadmap_id from roadmap_generation_test_state where slot = 'primary')),
  'generating',
  'a claimed roadmap enters generating state'
);
select extensions.is(
  (select generator_key from public.study_roadmaps where id = (select roadmap_id from roadmap_generation_test_state where slot = 'primary')),
  'deterministic-v1',
  'the claim records the provider adapter version'
);
select extensions.is(
  (select generation_attempts from public.study_roadmaps where id = (select roadmap_id from roadmap_generation_test_state where slot = 'primary')),
  1,
  'the initial claim records one generation attempt'
);
select extensions.ok(
  (
    select sources @> jsonb_build_array(
      jsonb_build_object('noteId', '93939393-9393-4393-8393-939393939393')
    )
    from roadmap_generation_test_state
    where slot = 'primary'
  ),
  'the worker receives the server-selected source ID'
);
select extensions.ok(
  (
    select sources @> jsonb_build_array(
      jsonb_build_object('excerpt', 'Round robin scheduling uses a rotating ready queue.')
    )
    from roadmap_generation_test_state
    where slot = 'primary'
  ),
  'private extracted text is available only in the worker claim payload'
);
select extensions.is(
  (
    select claim_status
    from public.claim_roadmap_generation(
      (select roadmap_id from roadmap_generation_test_state where slot = 'primary'),
      '92929292-9292-4292-8292-929292929292',
      'deterministic-v1'
    )
  ),
  'not_found',
  'a mismatched owner cannot claim another student roadmap'
);
select extensions.is(
  (
    select claim_status
    from public.claim_roadmap_generation(
      (select roadmap_id from roadmap_generation_test_state where slot = 'primary'),
      '91919191-9191-4191-8191-919191919191',
      'deterministic-v1'
    )
  ),
  'already_running',
  'a fresh in-flight claim cannot be duplicated'
);
select extensions.is(
  public.mark_roadmap_generation_failed(
    (select roadmap_id from roadmap_generation_test_state where slot = 'primary'),
    '92929292-9292-4292-8292-929292929292',
    'provider_failed'
  ),
  false,
  'a mismatched owner cannot fail another student roadmap'
);
select extensions.is(
  public.mark_roadmap_generation_failed(
    (select roadmap_id from roadmap_generation_test_state where slot = 'primary'),
    '91919191-9191-4191-8191-919191919191',
    'provider_failed'
  ),
  true,
  'the service worker can safely fail its claimed roadmap'
);
select extensions.is(
  (select failure_code from public.study_roadmaps where id = (select roadmap_id from roadmap_generation_test_state where slot = 'primary')),
  'provider_failed',
  'safe failure state is stored without provider details'
);
select extensions.is(
  (
    select claim_status
    from public.claim_roadmap_generation(
      (select roadmap_id from roadmap_generation_test_state where slot = 'primary'),
      '91919191-9191-4191-8191-919191919191',
      'deterministic-v1'
    )
  ),
  'claimed',
  'a failed roadmap can be claimed for retry'
);
select extensions.is(
  (select generation_attempts from public.study_roadmaps where id = (select roadmap_id from roadmap_generation_test_state where slot = 'primary')),
  2,
  'retry increments the generation attempt count'
);
select extensions.throws_ok(
  format(
    'select public.mark_roadmap_generation_failed(%L, %L, %L)',
    (select roadmap_id from roadmap_generation_test_state where slot = 'primary'),
    '91919191-9191-4191-8191-919191919191',
    'Unsafe failure detail!'
  ),
  '22023',
  'Invalid roadmap failure code',
  'unsafe failure detail is rejected'
);
select extensions.is(
  public.save_roadmap_snapshot(
    (select roadmap_id from roadmap_generation_test_state where slot = 'primary'),
    'Operating Systems deterministic roadmap',
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Scheduling review',
        'timeframe', 'Day 1',
        'summary', 'Review scheduling from the cited note.',
        'tasks', jsonb_build_array('Read the scheduling source'),
        'sourceNoteIds', jsonb_build_array('93939393-9393-4393-8393-939393939393')
      )
    )
  ),
  true,
  'validated worker output can complete the static snapshot'
);
select extensions.is(
  (
    select claim_status
    from public.claim_roadmap_generation(
      (select roadmap_id from roadmap_generation_test_state where slot = 'primary'),
      '91919191-9191-4191-8191-919191919191',
      'deterministic-v1'
    )
  ),
  'not_retryable',
  'a ready static snapshot cannot be generated again'
);

set local role postgres;
insert into public.study_roadmaps (
  id, owner_id, title, topic, study_mode, generation_plan, status
)
values (
  '95959595-9595-4595-8595-959595959595',
  '91919191-9191-4191-8191-919191919191',
  'Empty source roadmap', 'Empty source topic', 'exam', 'free', 'draft'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.is(
  (
    select claim_status
    from public.claim_roadmap_generation(
      '95959595-9595-4595-8595-959595959595',
      '91919191-9191-4191-8191-919191919191',
      'deterministic-v1'
    )
  ),
  'no_sources',
  'a roadmap without server-selected sources fails closed'
);
select extensions.is(
  (select failure_code from public.study_roadmaps where id = '95959595-9595-4595-8595-959595959595'),
  'no_sources',
  'the no-source failure is recorded safely'
);

set local role postgres;
update public.notes
set moderation_status = 'clear'
where id = '93939393-9393-4393-8393-939393939393';

set local role authenticated;
select set_config('request.jwt.claim.sub', '91919191-9191-4191-8191-919191919191', true);
select set_config('request.jwt.claims', '{"sub":"91919191-9191-4191-8191-919191919191","role":"authenticated"}', true);
insert into roadmap_generation_test_state (slot, roadmap_id)
select 'changed-source', roadmap_id
from public.create_roadmap_source_snapshot('Scheduling', 'indepth');

set local role postgres;
update public.notes
set moderation_status = 'restricted'
where id = '93939393-9393-4393-8393-939393939393';

set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.is(
  (
    select claim_status
    from public.claim_roadmap_generation(
      (select roadmap_id from roadmap_generation_test_state where slot = 'changed-source'),
      '91919191-9191-4191-8191-919191919191',
      'deterministic-v1'
    )
  ),
  'source_access_changed',
  'generation fails if any snapshotted source becomes unavailable'
);
select extensions.is(
  (select failure_code from public.study_roadmaps where id = (select roadmap_id from roadmap_generation_test_state where slot = 'changed-source')),
  'source_access_changed',
  'source authorization changes are persisted as a safe failure code'
);

select * from extensions.finish();
rollback;
