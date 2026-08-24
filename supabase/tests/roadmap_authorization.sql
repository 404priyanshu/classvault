-- Transactional pgTAP coverage for roadmap source selection, snapshots,
-- progress privacy, and shared-section authorization.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(39);

create temp table roadmap_test_state (
  roadmap_id uuid primary key,
  share_token uuid
);
grant select, insert, update on roadmap_test_state to authenticated, anon;

select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_roadmaps', 'SELECT'),
  'authenticated users cannot read roadmap tables directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.roadmap_sources', 'SELECT'),
  'roadmap source snapshots remain private'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.roadmap_sections', 'SELECT'),
  'roadmap sections remain private'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.roadmap_tasks', 'SELECT'),
  'roadmap tasks remain private'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.roadmap_task_progress', 'SELECT'),
  'owner progress remains private'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.roadmap_share_links', 'SELECT'),
  'share tokens cannot be read directly'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.create_roadmap_source_snapshot(text,text)', 'EXECUTE'),
  'authenticated students can create server-owned source snapshots'
);
select extensions.ok(
  has_function_privilege('anon', 'public.get_roadmap_snapshot(uuid,uuid)', 'EXECUTE'),
  'anonymous share viewers can use the access-filtered snapshot function'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.list_plan_eligible_roadmap_sources(uuid,text)', 'EXECUTE'),
  'students cannot choose their own generation plan or source owner'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.save_roadmap_snapshot(uuid,text,jsonb)', 'EXECUTE'),
  'students cannot write generated snapshot content directly'
);
select extensions.ok(
  has_function_privilege('service_role', 'public.save_roadmap_snapshot(uuid,text,jsonb)', 'EXECUTE'),
  'the generation worker role can save validated snapshot content'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4bab-8bab-ababababab01', 'authenticated', 'authenticated', 'roadmap-owner@bennett.edu.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4bab-8bab-ababababab02', 'authenticated', 'authenticated', 'roadmap-peer@bennett.edu.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4bab-8bab-ababababab03', 'authenticated', 'authenticated', 'roadmap-outsider@iitd.ac.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4bab-8bab-ababababab04', 'authenticated', 'authenticated', 'roadmap-incomplete@example.com', '', now(), '{}', '{}', now(), now());

update public.profiles
set onboarding_completed_at = now()
where id in (
  'abababab-abab-4bab-8bab-ababababab01',
  'abababab-abab-4bab-8bab-ababababab02',
  'abababab-abab-4bab-8bab-ababababab03'
);

insert into public.university_memberships (
  user_id, university_id, academic_email, status, role, verified_at
)
values
  ('abababab-abab-4bab-8bab-ababababab01', (select id from public.universities where slug = 'bennett-university'), 'roadmap-owner@bennett.edu.in', 'verified', 'student', now()),
  ('abababab-abab-4bab-8bab-ababababab02', (select id from public.universities where slug = 'bennett-university'), 'roadmap-peer@bennett.edu.in', 'verified', 'student', now()),
  ('abababab-abab-4bab-8bab-ababababab03', (select id from public.universities where slug = 'iit-delhi'), 'roadmap-outsider@iitd.ac.in', 'verified', 'student', now());

insert into public.notes (
  id, owner_id, subject_id, visibility, university_id, title, note_type,
  tags, publication_status, published_at
)
values
  ('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd01', 'abababab-abab-4bab-8bab-ababababab01', (select id from public.subjects where slug = 'operating-systems' limit 1), 'public', null, 'Owner public roadmap note', 'summary', array['roadmap'], 'published', now() - interval '1 minute'),
  ('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd02', 'abababab-abab-4bab-8bab-ababababab01', (select id from public.subjects where slug = 'operating-systems' limit 1), 'university', (select id from public.universities where slug = 'bennett-university'), 'Owner Bennett roadmap note', 'summary', array['roadmap'], 'published', now() - interval '2 minutes'),
  ('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd03', 'abababab-abab-4bab-8bab-ababababab02', (select id from public.subjects where slug = 'operating-systems' limit 1), 'university', (select id from public.universities where slug = 'bennett-university'), 'Peer Bennett roadmap note', 'summary', array['roadmap'], 'published', now() - interval '3 minutes'),
  ('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd04', 'abababab-abab-4bab-8bab-ababababab03', (select id from public.subjects where slug = 'operating-systems' limit 1), 'university', (select id from public.universities where slug = 'iit-delhi'), 'IIT roadmap note', 'summary', array['roadmap'], 'published', now() - interval '4 minutes'),
  ('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd05', 'abababab-abab-4bab-8bab-ababababab02', (select id from public.subjects where slug = 'operating-systems' limit 1), 'public', null, 'Peer public roadmap note', 'summary', array['roadmap'], 'published', now() - interval '5 minutes');

insert into public.note_assets (
  id, note_id, storage_backend, object_key, original_filename,
  detected_mime_type, byte_size, sha256, processing_status
)
select
  asset_id,
  note_id,
  'supabase_storage',
  format('notes/%s/source/%s', note_id, asset_id),
  'roadmap.pdf',
  'application/pdf',
  128,
  repeat(checksum_character, 64),
  'ready'
from (
  values
    ('efefefef-efef-4fef-8fef-efefefefef01'::uuid, 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd01'::uuid, 'a'),
    ('efefefef-efef-4fef-8fef-efefefefef02'::uuid, 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd02'::uuid, 'b'),
    ('efefefef-efef-4fef-8fef-efefefefef03'::uuid, 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd03'::uuid, 'c'),
    ('efefefef-efef-4fef-8fef-efefefefef04'::uuid, 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd04'::uuid, 'd'),
    ('efefefef-efef-4fef-8fef-efefefefef05'::uuid, 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd05'::uuid, 'e')
) as fixture(asset_id, note_id, checksum_character);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-abab-4bab-8bab-ababababab01', true);
select set_config('request.jwt.claims', '{"sub":"abababab-abab-4bab-8bab-ababababab01","role":"authenticated"}', true);

select extensions.is(
  (select personal_count from public.preview_roadmap_source_eligibility()),
  2::bigint,
  'Free source preview includes both personal uploads'
);
select extensions.ok(
  (select public_count >= 1 from public.preview_roadmap_source_eligibility()),
  'Free source preview includes public notes from other students'
);
select extensions.is(
  (select eligible_university_count from public.preview_roadmap_source_eligibility()),
  0::bigint,
  'Free source preview excludes other students campus notes'
);
select extensions.ok(
  (select pro_university_count >= 1 from public.preview_roadmap_source_eligibility()),
  'Pro-ready source preview includes current-campus peer notes'
);
select extensions.ok(
  (
    select created.source_count = eligibility.total_eligible_count
    from public.preview_roadmap_source_eligibility() as eligibility
    cross join public.create_roadmap_source_snapshot('Operating Systems', 'exam') as created
  ),
  'Free source snapshots include the complete server-selected eligible pool'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);

select extensions.is(
  (select count(*) from public.roadmap_sources where roadmap_id = (select id from public.study_roadmaps limit 1) and source_scope = 'university'),
  0::bigint,
  'Free snapshots contain no peer university source rows'
);
select extensions.is(
  (select count(*) from public.roadmap_sources where roadmap_id = (select id from public.study_roadmaps limit 1) and source_scope = 'personal'),
  2::bigint,
  'Personal source scope is preserved for owner uploads'
);
select extensions.is(
  (select count(*) from public.list_plan_eligible_roadmap_sources('abababab-abab-4bab-8bab-ababababab01', 'pro') where source_scope = 'university'),
  1::bigint,
  'Private Pro source selection includes a same-campus peer note'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.is(
  (
    select public.save_roadmap_snapshot(
      roadmap.id,
      'Operating Systems exam roadmap',
      jsonb_build_array(
        jsonb_build_object(
          'title', 'Scheduling foundations',
          'timeframe', 'Day 1–2',
          'summary', 'Review the scheduling foundations from the cited notes.',
          'tasks', jsonb_build_array('Read both source notes', 'Complete a scheduling quiz'),
          'sourceNoteIds', jsonb_build_array(
            'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd02',
            'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd05'
          )
        ),
        jsonb_build_object(
          'title', 'Public review',
          'timeframe', 'Day 3',
          'summary', 'Review material derived only from a public note.',
          'tasks', jsonb_build_array('Summarize the public source'),
          'sourceNoteIds', jsonb_build_array(
            'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd05'
          )
        )
      )
    )
    from public.study_roadmaps as roadmap
    limit 1
  ),
  true,
  'The service role can save a cited static roadmap snapshot'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-abab-4bab-8bab-ababababab01', true);
select set_config('request.jwt.claims', '{"sub":"abababab-abab-4bab-8bab-ababababab01","role":"authenticated"}', true);

select extensions.ok(
  (select public.get_roadmap_snapshot(roadmap_id) is not null from public.list_owned_roadmaps() limit 1),
  'Owners can read their private ready snapshot'
);
select extensions.is(
  (select (public.get_roadmap_snapshot(roadmap_id) #>> '{sections,0,available}')::boolean from public.list_owned_roadmaps() limit 1),
  true,
  'Owners see an available section sourced from their university upload'
);
select extensions.is(
  (
    select public.set_roadmap_task_progress(
      (public.get_roadmap_snapshot(roadmap_id) #>> '{sections,0,tasks,0,id}')::bigint,
      true
    )
    from public.list_owned_roadmaps()
    limit 1
  ),
  true,
  'Owners can update their private task progress'
);
select extensions.is(
  (select (public.get_roadmap_snapshot(roadmap_id) #>> '{sections,0,tasks,0,completed}')::boolean from public.list_owned_roadmaps() limit 1),
  true,
  'Owner snapshot reads include private progress'
);
insert into roadmap_test_state (roadmap_id, share_token)
select roadmap_id, public.set_roadmap_sharing(roadmap_id, true)
from public.list_owned_roadmaps()
limit 1;

select extensions.ok(
  (select share_token is not null from roadmap_test_state limit 1),
  'Owners can enable a revocable share token'
);

set local role postgres;
update public.university_memberships
set status = 'rejected',
    verified_at = null
where user_id = 'abababab-abab-4bab-8bab-ababababab01';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-abab-4bab-8bab-ababababab01', true);
select set_config('request.jwt.claims', '{"sub":"abababab-abab-4bab-8bab-ababababab01","role":"authenticated"}', true);
select extensions.is(
  (select personal_count from public.preview_roadmap_source_eligibility()),
  2::bigint,
  'Personal old-campus uploads remain eligible after membership loss'
);
select extensions.is(
  (select (public.get_roadmap_snapshot(roadmap_id) #>> '{sections,0,available}')::boolean from public.list_owned_roadmaps() limit 1),
  true,
  'Owners retain derived sections from their old-campus uploads'
);
select extensions.is(
  (select (public.get_roadmap_snapshot(roadmap_id) #>> '{sections,0,sources,0,linkAvailable}')::boolean from public.list_owned_roadmaps() limit 1),
  false,
  'Old-campus source links remain unavailable without current membership'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select extensions.is(
  (
    select (public.get_roadmap_snapshot(state.roadmap_id, state.share_token) #>> '{sections,0,available}')::boolean
    from roadmap_test_state as state
    limit 1
  ),
  false,
  'Anonymous viewers cannot see a section with a university source'
);
select extensions.is(
  (
    select (public.get_roadmap_snapshot(state.roadmap_id, state.share_token) #>> '{sections,1,available}')::boolean
    from roadmap_test_state as state
    limit 1
  ),
  true,
  'Anonymous viewers can see a section derived only from public sources'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-abab-4bab-8bab-ababababab02', true);
select set_config('request.jwt.claims', '{"sub":"abababab-abab-4bab-8bab-ababababab02","role":"authenticated"}', true);
select extensions.is(
  (
    select (public.get_roadmap_snapshot(state.roadmap_id, state.share_token) #>> '{sections,0,available}')::boolean
    from roadmap_test_state as state
    limit 1
  ),
  true,
  'Verified same-campus share viewers can see the complete section'
);
select extensions.ok(
  (
    select public.get_roadmap_snapshot(state.roadmap_id, state.share_token) #> '{sections,0,tasks,0,completed}' = 'null'::jsonb
    from roadmap_test_state as state
    limit 1
  ),
  'Shared viewers never receive owner progress'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-abab-4bab-8bab-ababababab03', true);
select set_config('request.jwt.claims', '{"sub":"abababab-abab-4bab-8bab-ababababab03","role":"authenticated"}', true);
select extensions.is(
  (
    select (public.get_roadmap_snapshot(state.roadmap_id, state.share_token) #>> '{sections,0,available}')::boolean
    from roadmap_test_state as state
    limit 1
  ),
  false,
  'Cross-university share viewers receive a restricted placeholder'
);
select extensions.is(
  (select public.get_roadmap_snapshot(roadmap_id) from roadmap_test_state limit 1),
  null::jsonb,
  'Non-owners cannot read a private roadmap without its share token'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-abab-4bab-8bab-ababababab01', true);
select set_config('request.jwt.claims', '{"sub":"abababab-abab-4bab-8bab-ababababab01","role":"authenticated"}', true);
select extensions.ok(
  public.set_roadmap_sharing((select roadmap_id from roadmap_test_state limit 1), false) is null,
  'Owners can revoke sharing'
);
select extensions.is(
  (select sharing_enabled from public.list_owned_roadmaps() limit 1),
  false,
  'Revoked roadmap sharing is reflected in the owner summary'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select extensions.is(
  (
    select public.get_roadmap_snapshot(state.roadmap_id, state.share_token)
    from roadmap_test_state as state
    limit 1
  ),
  null::jsonb,
  'Revoked share tokens stop returning roadmap data'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
update public.notes
set moderation_status = 'restricted'
where id = 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcd02';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-abab-4bab-8bab-ababababab01', true);
select set_config('request.jwt.claims', '{"sub":"abababab-abab-4bab-8bab-ababababab01","role":"authenticated"}', true);
select extensions.is(
  (select (public.get_roadmap_snapshot(roadmap_id) #>> '{sections,0,available}')::boolean from public.list_owned_roadmaps() limit 1),
  false,
  'Restricted source notes hide the derived section even from the owner'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-abab-4bab-8bab-ababababab04', true);
select set_config('request.jwt.claims', '{"sub":"abababab-abab-4bab-8bab-ababababab04","role":"authenticated"}', true);
select extensions.is(
  (select count(*) from public.preview_roadmap_source_eligibility()),
  0::bigint,
  'Onboarding-incomplete students receive no source preview'
);

select * from extensions.finish();
rollback;
