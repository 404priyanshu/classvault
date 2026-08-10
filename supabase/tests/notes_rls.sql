begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(38);

select extensions.ok(
  not has_table_privilege('anon', 'public.notes', 'SELECT'),
  'anonymous users have no notes table access'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.notes', 'SELECT'),
  'authenticated users receive RLS-filtered notes metadata access'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.notes', 'INSERT'),
  'authenticated users cannot insert notes directly'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.notes', 'UPDATE'),
  'authenticated users cannot update notes directly'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.notes', 'DELETE'),
  'authenticated users cannot delete notes directly'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.note_assets', 'SELECT'),
  'private asset metadata has no direct authenticated read grant'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.note_search_documents', 'SELECT'),
  'extracted note text has no direct authenticated read grant'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.platform_roles', 'SELECT'),
  'platform role assignments have no direct authenticated read grant'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.can_view_note_metadata(uuid)',
    'EXECUTE'
  ),
  'anonymous users cannot execute note authorization helpers'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.can_view_note_metadata(uuid)',
    'EXECUTE'
  ),
  'authenticated users can execute the metadata authorization helper'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'owner@bennett.edu.in',
    '',
    now(),
    '{}',
    '{"full_name":"Bennett Owner"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'student@iitd.ac.in',
    '',
    now(),
    '{}',
    '{"full_name":"Delhi Student"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'pending@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Pending Student"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'moderator@bennett.edu.in',
    '',
    now(),
    '{}',
    '{"full_name":"Campus Moderator"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated',
    'authenticated',
    'platform@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Platform Moderator"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666666',
    'authenticated',
    'authenticated',
    'incomplete@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Incomplete Student"}',
    now(),
    now()
  );

update public.profiles
set onboarding_completed_at = now()
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555'
);

insert into public.university_memberships (
  user_id,
  university_id,
  academic_email,
  status,
  role,
  verified_at
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    (select id from public.universities where slug = 'bennett-university'),
    'owner@bennett.edu.in',
    'verified',
    'student',
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    (select id from public.universities where slug = 'iit-delhi'),
    'student@iitd.ac.in',
    'verified',
    'student',
    now()
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    (select id from public.universities where slug = 'bennett-university'),
    'pending@example.com',
    'pending',
    'student',
    null
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    (select id from public.universities where slug = 'bennett-university'),
    'moderator@bennett.edu.in',
    'verified',
    'moderator',
    now()
  );

insert into public.platform_roles (user_id, role)
values (
  '55555555-5555-4555-8555-555555555555',
  'platform_moderator'
);

insert into public.subjects (university_id, slug, name)
values
  (
    (select id from public.universities where slug = 'bennett-university'),
    'bennett-private-subject',
    'Bennett Private Subject'
  ),
  (
    (select id from public.universities where slug = 'iit-delhi'),
    'iit-delhi-private-subject',
    'IIT Delhi Private Subject'
  );

insert into public.notes (
  id,
  owner_id,
  subject_id,
  visibility,
  university_id,
  title,
  note_type,
  publication_status,
  moderation_status,
  published_at,
  deleted_at,
  purge_after
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    (select id from public.subjects where slug = 'operating-systems'),
    'public',
    null,
    'Public operating systems notes',
    'lecture_notes',
    'published',
    'clear',
    now(),
    null,
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '11111111-1111-4111-8111-111111111111',
    (select id from public.subjects where slug = 'bennett-private-subject'),
    'university',
    (select id from public.universities where slug = 'bennett-university'),
    'Bennett university notes',
    'summary',
    'published',
    'clear',
    now(),
    null,
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '22222222-2222-4222-8222-222222222222',
    (select id from public.subjects where slug = 'iit-delhi-private-subject'),
    'university',
    (select id from public.universities where slug = 'iit-delhi'),
    'IIT Delhi university notes',
    'summary',
    'published',
    'clear',
    now(),
    null,
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    '11111111-1111-4111-8111-111111111111',
    (select id from public.subjects where slug = 'operating-systems'),
    'public',
    null,
    'Deleted owner notes',
    'other',
    'published',
    'clear',
    now() - interval '1 day',
    now() - interval '1 day',
    now() + interval '29 days'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    '11111111-1111-4111-8111-111111111111',
    (select id from public.subjects where slug = 'bennett-private-subject'),
    'university',
    (select id from public.universities where slug = 'bennett-university'),
    'Restricted Bennett notes',
    'other',
    'published',
    'restricted',
    now(),
    null,
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
    '22222222-2222-4222-8222-222222222222',
    (select id from public.subjects where slug = 'iit-delhi-private-subject'),
    'university',
    (select id from public.universities where slug = 'iit-delhi'),
    'Restricted IIT Delhi notes',
    'other',
    'published',
    'restricted',
    now(),
    null,
    null
  );

insert into public.note_assets (
  id,
  note_id,
  storage_backend,
  object_key,
  original_filename,
  detected_mime_type,
  byte_size,
  sha256,
  processing_status
)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'test',
  'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/source/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  'operating-systems.pdf',
  'application/pdf',
  1024,
  repeat('a', 64),
  'ready'
);

insert into public.note_rating_summaries (
  note_id,
  rating_count,
  average_rating,
  effective_rating_count,
  weighted_score,
  last_rated_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    1,
    4,
    1,
    3.8,
    now()
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    1,
    5,
    1,
    3.9,
    now()
  );

insert into public.note_ratings (note_id, user_id, rating)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '33333333-3333-4333-8333-333333333333',
  4
);

insert into public.note_reports (
  note_id,
  reporter_id,
  category,
  details
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '33333333-3333-4333-8333-333333333333',
  'misleading',
  'Test report'
);

insert into public.note_moderation_actions (
  note_id,
  actor_id,
  action,
  reason_code
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    '44444444-4444-4444-8444-444444444444',
    'restrict',
    'test-campus-restriction'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
    '55555555-5555-4555-8555-555555555555',
    'restrict',
    'test-platform-restriction'
  );

select extensions.throws_ok(
  $$
    update public.notes
    set visibility = 'university',
        university_id = (
          select id from public.universities where slug = 'bennett-university'
        )
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
  $$,
  '23514',
  'Published note publication state and scope are immutable',
  'published note scope cannot be changed'
);

select extensions.throws_ok(
  $$
    update public.note_assets
    set object_key = 'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/source/cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
  $$,
  '23514',
  'Published note source assets are immutable',
  'published source asset identity cannot be replaced'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '33333333-3333-4333-8333-333333333333',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*) from public.notes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  1::bigint,
  'pending students can read published public notes'
);

select extensions.is(
  (select count(*) from public.notes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  0::bigint,
  'pending students cannot read their selected university notes'
);

select extensions.ok(
  public.can_consume_note('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  'pending students can consume public notes'
);

select extensions.ok(
  not public.can_consume_note('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  'pending students cannot consume university notes'
);

select extensions.is(
  (select count(*) from public.subjects where slug = 'operating-systems'),
  1::bigint,
  'pending students can read global subjects'
);

select extensions.is(
  (select count(*) from public.subjects where slug = 'bennett-private-subject'),
  0::bigint,
  'pending students cannot read university subjects'
);

select extensions.is(
  (select count(*) from public.note_rating_summaries),
  1::bigint,
  'pending students see summaries only for readable notes'
);

select extensions.is(
  (select count(*) from public.note_ratings),
  1::bigint,
  'students can read only their own rating on a readable note'
);

select extensions.is(
  (select count(*) from public.note_reports),
  1::bigint,
  'reporters can read their own reports'
);

select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*) from public.notes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  1::bigint,
  'verified students can read their own university notes'
);

select extensions.is(
  (select count(*) from public.notes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
  0::bigint,
  'verified students cannot read another university notes by direct ID'
);

select extensions.is(
  (select count(*) from public.notes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'),
  1::bigint,
  'owners can see their deleted note metadata in Trash'
);

select extensions.ok(
  not public.can_consume_note('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'),
  'deleted notes cannot issue ordinary consumption access to their owner'
);

select extensions.is(
  (select count(*) from public.subjects where slug = 'bennett-private-subject'),
  1::bigint,
  'verified students can read subjects from their university'
);

select extensions.is(
  (select count(*) from public.note_ratings),
  0::bigint,
  'note owners cannot inspect another student raw rating row'
);

select extensions.is(
  (select count(*) from public.note_reports),
  0::bigint,
  'note owners cannot inspect reporter identity or report details'
);

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-4222-8222-222222222222',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*) from public.notes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  0::bigint,
  'a different verified university cannot read Bennett notes'
);

select extensions.is(
  (select count(*) from public.notes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
  1::bigint,
  'a verified student can read notes from their own university'
);

select set_config(
  'request.jwt.claim.sub',
  '44444444-4444-4444-8444-444444444444',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*) from public.notes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5'),
  1::bigint,
  'campus moderators can inspect restricted notes in their university'
);

select extensions.is(
  (select count(*) from public.notes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6'),
  0::bigint,
  'campus moderators cannot inspect restricted notes from another university'
);

select extensions.is(
  (select count(*) from public.note_moderation_actions),
  1::bigint,
  'campus moderators see only same-university moderation actions'
);

select set_config(
  'request.jwt.claim.sub',
  '55555555-5555-4555-8555-555555555555',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*) from public.notes where moderation_status = 'restricted'),
  2::bigint,
  'platform moderators can inspect restricted notes across universities'
);

select extensions.is(
  (select count(*) from public.note_moderation_actions),
  2::bigint,
  'platform moderators can inspect moderation actions across universities'
);

select extensions.is(
  (select count(*) from public.note_reports),
  1::bigint,
  'platform moderators can inspect reports across universities'
);

select extensions.ok(
  not public.can_consume_note('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5'),
  'moderator metadata access does not create ordinary access to restricted files'
);

select set_config(
  'request.jwt.claim.sub',
  '66666666-6666-4666-8666-666666666666',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*) from public.notes),
  0::bigint,
  'onboarding-incomplete users cannot read public notes'
);

reset role;

select * from extensions.finish();

rollback;
