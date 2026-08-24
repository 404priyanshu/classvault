-- Transactional pgTAP coverage for metadata indexing, extraction claims, and
-- permission-safe full-text search.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(16);

select extensions.ok(
  has_function_privilege('authenticated', 'public.list_notes_for_library(text,bigint,text,text,text,integer,integer)', 'EXECUTE'),
  'authenticated students can search through the permission-filtered library function'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.list_notes_for_library(text,bigint,text,text,text,integer,integer)', 'EXECUTE'),
  'anonymous users cannot search note metadata'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.claim_pending_note_extractions(integer)', 'EXECUTE'),
  'authenticated users cannot claim extraction work'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.complete_note_extraction(text,text,text,uuid)', 'EXECUTE'),
  'authenticated users cannot write extracted text'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888881', 'authenticated', 'authenticated', 'search-owner@bennett.edu.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888882', 'authenticated', 'authenticated', 'search-reader@iitd.ac.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888883', 'authenticated', 'authenticated', 'search-incomplete@example.com', '', now(), '{}', '{}', now(), now());

update public.profiles
set onboarding_completed_at = now()
where id in (
  '88888888-8888-4888-8888-888888888881',
  '88888888-8888-4888-8888-888888888882'
);

insert into public.university_memberships (
  user_id, university_id, academic_email, status, role, verified_at
)
values
  (
    '88888888-8888-4888-8888-888888888881',
    (select id from public.universities where slug = 'bennett-university'),
    'search-owner@bennett.edu.in', 'verified', 'student', now()
  ),
  (
    '88888888-8888-4888-8888-888888888882',
    (select id from public.universities where slug = 'iit-delhi'),
    'search-reader@iitd.ac.in', 'verified', 'student', now()
  );

insert into public.notes (
  id, owner_id, subject_id, visibility, university_id, title, description,
  note_type, tags, publication_status, published_at
)
values
  (
    '88888888-8888-4888-8888-888888888880',
    '88888888-8888-4888-8888-888888888881',
    (select id from public.subjects where slug = 'operating-systems' limit 1),
    'public', null, 'Quantum scheduling notes', 'Kernel scheduling review',
    'summary', array['quantum', 'scheduling'], 'published', now()
  ),
  (
    '88888888-8888-4888-8888-888888888879',
    '88888888-8888-4888-8888-888888888881',
    (select id from public.subjects where slug = 'operating-systems' limit 1),
    'university', (select id from public.universities where slug = 'bennett-university'),
    'Bennett confidential kernel notes', 'Campus-only secret material',
    'summary', array['campus-secret'], 'published', now()
  );

insert into public.note_assets (
  id, note_id, storage_backend, object_key, original_filename,
  detected_mime_type, byte_size, sha256, processing_status
)
values (
  '88888888-8888-4888-8888-888888888878',
  '88888888-8888-4888-8888-888888888880',
  'supabase_storage',
  'notes/88888888-8888-4888-8888-888888888880/source/88888888-8888-4888-8888-888888888878',
  'quantum.pdf', 'application/pdf', 128, repeat('a', 64), 'ready'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888882', true);
select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888882","role":"authenticated"}', true);

select extensions.is(
  (select count(*) from public.list_notes_for_library('quantum', null, 'all', 'all', 'newest', 10, 0) where id = '88888888-8888-4888-8888-888888888880'),
  1::bigint,
  'title and metadata terms are searchable for an eligible reader'
);
select extensions.is(
  (select count(*) from public.list_notes_for_library('campus-secret', null, 'all', 'all', 'newest', 10, 0) where id = '88888888-8888-4888-8888-888888888879'),
  0::bigint,
  'cross-university extracted/search terms remain hidden'
);

select extensions.throws_ok(
  $$select public.claim_pending_note_extractions(10)$$,
  '42501',
  'Extraction workers require the service role',
  'authenticated users cannot claim extraction jobs'
);

set local role postgres;
select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888882","role":"postgres"}', true);
select extensions.is(
  (select count(*) from public.claim_pending_note_extractions(10) where note_id = '88888888-8888-4888-8888-888888888880'),
  1::bigint,
  'the service role can atomically claim pending PDF extraction'
);
select extensions.is(
  (select extraction_status from public.note_search_documents where note_id = '88888888-8888-4888-8888-888888888880'),
  'processing',
  'claimed documents are marked processing'
);
select extensions.is(
  (select public.complete_note_extraction('ready', 'Quantum scheduling uses a round robin queue.', 'test-extractor-v1', '88888888-8888-4888-8888-888888888880')),
  true,
  'the service role can finalize extracted text'
);
select extensions.is(
  (select extraction_status from public.note_search_documents where note_id = '88888888-8888-4888-8888-888888888880'),
  'ready',
  'finalized documents are marked ready'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888882', true);
select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888882","role":"authenticated"}', true);

select extensions.is(
  (select count(*) from public.list_notes_for_library('round robin', null, 'all', 'all', 'newest', 10, 0) where id = '88888888-8888-4888-8888-888888888880'),
  1::bigint,
  'extracted PDF text is searchable'
);
select extensions.ok(
  (select search_snippet like '%round robin%' from public.list_notes_for_library('round robin', null, 'all', 'all', 'newest', 10, 0) where id = '88888888-8888-4888-8888-888888888880'),
  'search returns a snippet only for an accessible note'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888883', true);
select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888883","role":"authenticated"}', true);
select extensions.is(
  (select count(*) from public.list_notes_for_library('quantum', null, 'all', 'all', 'newest', 10, 0)),
  0::bigint,
  'onboarding-incomplete users cannot search notes'
);

set local role postgres;
select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888881","role":"postgres"}', true);
select extensions.is(
  (select public.complete_note_extraction('unsupported', null, 'test-extractor-v1', '88888888-8888-4888-8888-888888888879')),
  true,
  'unsupported assets can finish with a safe status'
);
select extensions.is(
  (select extraction_status from public.note_search_documents where note_id = '88888888-8888-4888-8888-888888888879'),
  'unsupported',
  'unsupported assets remain represented in the search document'
);

select * from extensions.finish();
rollback;
