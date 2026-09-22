-- Transactional pgTAP coverage for topic-based roadmap source selection.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(8);

create temp table topic_state (slot text primary key, roadmap_id uuid);
grant all on topic_state to authenticated, anon;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'a1a1a1a1-0000-4000-8000-00000000d001', 'authenticated', 'authenticated', 'topic-author@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1a1a1a1-0000-4000-8000-00000000d002', 'authenticated', 'authenticated', 'topic-student@example.com', '', now(), '{}', '{}', now(), now());

update public.profiles
set onboarding_completed_at = now()
where id in ('a1a1a1a1-0000-4000-8000-00000000d001', 'a1a1a1a1-0000-4000-8000-00000000d002');

-- Three public notes by one author: one filed under Operating Systems with no
-- topic words in its title, one about thermodynamics, and one filed elsewhere
-- whose text is about operating systems.
insert into public.notes (
  id, owner_id, subject_id, visibility, title, description, note_type,
  tags, publication_status, published_at
)
values
  ('b2b2b2b2-0000-4000-8000-00000000d001', 'a1a1a1a1-0000-4000-8000-00000000d001',
   (select id from public.subjects where slug = 'operating-systems' limit 1),
   'public', 'Deadlock conditions', 'Coffman conditions', 'summary', array['midsem'], 'published', now()),
  ('b2b2b2b2-0000-4000-8000-00000000d002', 'a1a1a1a1-0000-4000-8000-00000000d001',
   (select id from public.subjects where slug = 'thermodynamics' limit 1),
   'public', 'Laws of thermodynamics', 'Entropy and enthalpy', 'summary', array['physics'], 'published', now()),
  ('b2b2b2b2-0000-4000-8000-00000000d003', 'a1a1a1a1-0000-4000-8000-00000000d001',
   (select id from public.subjects where slug = 'mathematics' limit 1),
   'public', 'Queueing for CPU scheduling', 'Maths for schedulers', 'summary', array['queues'], 'published', now());

insert into public.note_assets (
  id, note_id, storage_backend, object_key, original_filename,
  detected_mime_type, byte_size, sha256, processing_status
)
select
  asset_id, note.id, 'supabase_storage',
  'notes/' || note.id || '/source/' || asset_id, 'fixture.pdf', 'application/pdf', 128,
  repeat('a', 64), 'ready'
from public.notes as note
cross join lateral (select md5(note.id::text || '-asset')::uuid as asset_id) as generated
where note.id in (
  'b2b2b2b2-0000-4000-8000-00000000d001',
  'b2b2b2b2-0000-4000-8000-00000000d002',
  'b2b2b2b2-0000-4000-8000-00000000d003'
);

update public.note_search_documents
set extraction_status = 'ready',
    extracted_text = 'Operating systems schedule processes with queueing models.',
    search_document = to_tsvector('simple', 'Operating systems schedule processes with queueing models.')
where note_id = 'b2b2b2b2-0000-4000-8000-00000000d003';

select extensions.ok(
  public.roadmap_topic_query('Intro to the OS and') is null,
  'a topic made only of short or filler words yields no query rather than matching everything'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1a1a1a1-0000-4000-8000-00000000d002', true);
select set_config('request.jwt.claims', '{"sub":"a1a1a1a1-0000-4000-8000-00000000d002","role":"authenticated"}', true);

insert into topic_state (slot, roadmap_id)
select 'os', roadmap_id from public.create_roadmap_source_snapshot('Operating Systems', 'exam');
insert into topic_state (slot, roadmap_id)
select 'nothing', roadmap_id from public.create_roadmap_source_snapshot('Xyzzy quantum basket weaving', 'exam');

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);

select extensions.ok(
  exists (select 1 from public.roadmap_sources
          where roadmap_id = (select roadmap_id from topic_state where slot = 'os')
            and note_id = 'b2b2b2b2-0000-4000-8000-00000000d001'),
  'a note filed under the subject is a source even without the topic words in its title'
);
select extensions.ok(
  exists (select 1 from public.roadmap_sources
          where roadmap_id = (select roadmap_id from topic_state where slot = 'os')
            and note_id = 'b2b2b2b2-0000-4000-8000-00000000d003'),
  'a note whose text is about the topic is a source even when filed elsewhere'
);
select extensions.ok(
  not exists (select 1 from public.roadmap_sources
              where roadmap_id = (select roadmap_id from topic_state where slot = 'os')
                and note_id = 'b2b2b2b2-0000-4000-8000-00000000d002'),
  'an unrelated note is not a source -- the bug this migration fixes'
);
select extensions.is(
  (select count(*) from public.roadmap_sources
   where roadmap_id = (select roadmap_id from topic_state where slot = 'nothing')),
  0::bigint,
  'a topic nothing matches gets no sources, not every note'
);

-- The cap: forty-five more subject matches, of which forty are kept.
insert into public.notes (
  id, owner_id, subject_id, visibility, title, description, note_type,
  tags, publication_status, published_at
)
select
  gen_random_uuid(), 'a1a1a1a1-0000-4000-8000-00000000d001',
  (select id from public.subjects where slug = 'operating-systems' limit 1),
  'public', 'OS fixture ' || n, 'Fixture', 'summary', array['fixture'], 'published', now()
from generate_series(1, 45) as n;

insert into public.note_assets (
  id, note_id, storage_backend, object_key, original_filename,
  detected_mime_type, byte_size, sha256, processing_status
)
select
  asset_id, note.id, 'supabase_storage',
  'notes/' || note.id || '/source/' || asset_id, 'fixture.pdf', 'application/pdf', 128,
  repeat('b', 64), 'ready'
from public.notes as note
cross join lateral (select md5(note.id::text || '-asset')::uuid as asset_id) as generated
where note.title like 'OS fixture %';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1a1a1a1-0000-4000-8000-00000000d002', true);
select set_config('request.jwt.claims', '{"sub":"a1a1a1a1-0000-4000-8000-00000000d002","role":"authenticated"}', true);
insert into topic_state (slot, roadmap_id)
select 'capped', roadmap_id from public.create_roadmap_source_snapshot('Operating Systems', 'indepth');

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.is(
  (select count(*) from public.roadmap_sources
   where roadmap_id = (select roadmap_id from topic_state where slot = 'capped')),
  40::bigint,
  'a snapshot keeps at most forty sources'
);
select extensions.ok(
  not exists (select 1 from public.roadmap_sources
              where roadmap_id = (select roadmap_id from topic_state where slot = 'capped')
                and note_id = 'b2b2b2b2-0000-4000-8000-00000000d002'),
  'the unrelated note stays out even when the cap is reached'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.roadmap_topic_query(text)', 'EXECUTE'),
  'the topic helper is internal to snapshot creation'
);

select * from extensions.finish();
rollback;
