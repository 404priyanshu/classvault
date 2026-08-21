-- Transactional pgTAP coverage for rating mutation and recency-weighted
-- ranking. Expected weighted scores use the spec formula with prior
-- strength 8 and default cohort mean 3.5.
begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(29);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.rate_note(uuid, smallint)',
    'EXECUTE'
  ),
  'anonymous users cannot submit ratings'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.rate_note(uuid, smallint)',
    'EXECUTE'
  ),
  'authenticated users can submit ratings'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.list_notes_for_library(text, bigint, text, text, text, integer, integer)',
    'EXECUTE'
  ),
  'anonymous users cannot list library notes'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.list_notes_for_library(text, bigint, text, text, text, integer, integer)',
    'EXECUTE'
  ),
  'authenticated users can list library notes'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.refresh_note_rating_summary(uuid)',
    'EXECUTE'
  ),
  'anonymous users cannot refresh rating summaries'
);

select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.refresh_note_rating_summary(uuid)',
    'EXECUTE'
  ),
  'clients cannot refresh rating summaries directly'
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
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'rating-owner@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Rating Owner"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'rating-reader@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Rating Reader"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated',
    'authenticated',
    'rating-incomplete@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Rating Incomplete"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '77777777-7777-4777-8777-777777777777',
    'authenticated',
    'authenticated',
    'campus-rater@bennett.edu.in',
    '',
    now(),
    '{}',
    '{"full_name":"Campus Rater"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '88888888-8888-4888-8888-888888888888',
    'authenticated',
    'authenticated',
    'outside-rater@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Outside Rater"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'rater-one@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Rater One"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'rater-two@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Rater Two"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'rater-three@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Rater Three"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'rater-four@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Rater Four"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated',
    'authenticated',
    'rater-five@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Rater Five"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666666',
    'authenticated',
    'authenticated',
    'rater-six@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Rater Six"}',
    now(),
    now()
  );

update public.profiles
set onboarding_completed_at = now()
where id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666'
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
    '77777777-7777-4777-8777-777777777777',
    (select id from public.universities where slug = 'bennett-university'),
    'campus-rater@bennett.edu.in',
    'verified',
    'student',
    now()
  );

insert into public.notes (
  id,
  owner_id,
  subject_id,
  visibility,
  university_id,
  title,
  description,
  note_type,
  publication_status,
  published_at
)
values
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.subjects where slug = 'data-structures'),
    'public',
    null,
    'Rated note fixture',
    'A published note used for rating mutation tests.',
    'summary',
    'published',
    now()
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.subjects where slug = 'data-structures'),
    'public',
    null,
    'Draft note fixture',
    'An unpublished draft that must reject ratings.',
    'summary',
    'draft',
    null
  ),
  (
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.subjects where slug = 'data-structures'),
    'university',
    (select id from public.universities where slug = 'bennett-university'),
    'Campus note fixture',
    'A Bennett-only note used for scope denial tests.',
    'lecture_notes',
    'published',
    now()
  ),
  (
    '90909090-9090-4909-8909-909090909090',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.subjects where slug = 'operating-systems'),
    'public',
    null,
    'Ranking fixture volume',
    'Sustained community trust across six ratings.',
    'summary',
    'published',
    now() - interval '3 days'
  ),
  (
    '91919191-9191-4919-8919-919191919191',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.subjects where slug = 'operating-systems'),
    'public',
    null,
    'Ranking fixture stale',
    'Old positive ratings past two half-lives.',
    'summary',
    'published',
    now() - interval '2 days'
  ),
  (
    '92929292-9292-4929-8929-929292929292',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.subjects where slug = 'operating-systems'),
    'public',
    null,
    'Ranking fixture fresh',
    'A single recent five-star rating.',
    'summary',
    'published',
    now() - interval '1 day'
  );

insert into public.note_ratings (note_id, user_id, rating)
values
  (
    '90909090-9090-4909-8909-909090909090',
    '11111111-1111-4111-8111-111111111111',
    5
  ),
  (
    '90909090-9090-4909-8909-909090909090',
    '22222222-2222-4222-8222-222222222222',
    5
  ),
  (
    '90909090-9090-4909-8909-909090909090',
    '33333333-3333-4333-8333-333333333333',
    5
  ),
  (
    '90909090-9090-4909-8909-909090909090',
    '44444444-4444-4444-8444-444444444444',
    4
  ),
  (
    '90909090-9090-4909-8909-909090909090',
    '55555555-5555-4555-8555-555555555555',
    4
  ),
  (
    '90909090-9090-4909-8909-909090909090',
    '66666666-6666-4666-8666-666666666666',
    4
  ),
  (
    '91919191-9191-4919-8919-919191919191',
    '11111111-1111-4111-8111-111111111111',
    5
  ),
  (
    '91919191-9191-4919-8919-919191919191',
    '22222222-2222-4222-8222-222222222222',
    5
  ),
  (
    '92929292-9292-4929-8929-929292929292',
    '11111111-1111-4111-8111-111111111111',
    5
  );

alter table public.note_ratings disable trigger note_ratings_set_updated_at;

update public.note_ratings
set updated_at = now() - interval '730 days'
where note_id = '91919191-9191-4919-8919-919191919191';

alter table public.note_ratings enable trigger note_ratings_set_updated_at;

select public.refresh_note_rating_summary(
  '90909090-9090-4909-8909-909090909090'::uuid
);
select public.refresh_note_rating_summary(
  '91919191-9191-4919-8919-919191919191'::uuid
);
select public.refresh_note_rating_summary(
  '92929292-9292-4929-8929-929292929292'::uuid
);

set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '',
  true
);
select set_config(
  'request.jwt.claims',
  '{}',
  true
);

select extensions.is(
  (
    select result.error_code
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      4::smallint
    ) as result
  ),
  'unauthenticated',
  'a request without an identity cannot rate'
);

select set_config(
  'request.jwt.claim.sub',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select result.error_code
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      6::smallint
    ) as result
  ),
  'invalid_rating',
  'ratings above five are rejected'
);

select extensions.is(
  (
    select result.error_code
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      0::smallint
    ) as result
  ),
  'invalid_rating',
  'ratings below one are rejected'
);

select extensions.is(
  (
    select result.error_code
    from public.rate_note(
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
      4::smallint
    ) as result
  ),
  'note_unavailable',
  'draft notes cannot be rated'
);

select set_config(
  'request.jwt.claim.sub',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select result.error_code
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      4::smallint
    ) as result
  ),
  'not_permitted',
  'an onboarding-incomplete user cannot rate'
);

select set_config(
  'request.jwt.claim.sub',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select result.error_code
    from public.rate_note(
      'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid,
      4::smallint
    ) as result
  ),
  'not_permitted',
  'a student outside the university cannot rate a campus note'
);

select set_config(
  'request.jwt.claim.sub',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select result.error_code
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      5::smallint
    ) as result
  ),
  'self_rating_forbidden',
  'owners cannot rate their own notes'
);

select set_config(
  'request.jwt.claim.sub',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select result.success
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      4::smallint
    ) as result
  ),
  true,
  'an eligible student can rate a consumable note'
);

select extensions.is(
  (
    select result.rating_count
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      4::smallint
    ) as result
  ),
  1::bigint,
  'the refreshed summary reports one rating'
);

select extensions.is(
  (
    select result.average_rating
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      4::smallint
    ) as result
  ),
  4.00::numeric,
  'the refreshed summary reports the four-star average'
);

select extensions.is(
  (
    select round(result.weighted_score, 4)
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      4::smallint
    ) as result
  ),
  3.5556::numeric,
  'an empty cohort applies the documented default prior of 3.5'
);

select extensions.is(
  (
    select result.rating_count
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      5::smallint
    ) as result
  ),
  1::bigint,
  're-rating keeps a single row per student'
);

select extensions.is(
  (
    select result.average_rating
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      5::smallint
    ) as result
  ),
  5.00::numeric,
  're-rating updates the stored average'
);

select extensions.is(
  (
    select round(result.weighted_score, 4)
    from public.rate_note(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      5::smallint
    ) as result
  ),
  3.6667::numeric,
  're-rating refreshes the weighted score'
);

select extensions.is(
  (
    select array_agg(t.id order by t.ord)
    from (
      select listed.id, row_number() over () as ord
      from public.list_notes_for_library(
        null,
        (select id from public.subjects where slug = 'operating-systems'),
        'all',
        'all',
        'top',
        10,
        0
      ) as listed
    ) as t
  ),
  array[
    '90909090-9090-4909-8909-909090909090'::uuid,
    '92929292-9292-4929-8929-929292929292'::uuid,
    '91919191-9191-4919-8919-919191919191'::uuid
  ],
  'top sort ranks sustained trust above a single fresh rating and rewards recency'
);

select extensions.is(
  (
    select listed.total_count
    from public.list_notes_for_library(
      null,
      (select id from public.subjects where slug = 'operating-systems'),
      'all',
      'all',
      'top',
      10,
      0
    ) as listed
    limit 1
  ),
  3::bigint,
  'total counts reflect the accessible set before pagination'
);

select extensions.is(
  (
    select array_agg(t.id order by t.ord)
    from (
      select listed.id, row_number() over () as ord
      from public.list_notes_for_library(
        null,
        (select id from public.subjects where slug = 'operating-systems'),
        'all',
        'all',
        'top',
        2,
        1
      ) as listed
    ) as t
  ),
  array[
    '92929292-9292-4929-8929-929292929292'::uuid,
    '91919191-9191-4919-8919-919191919191'::uuid
  ],
  'pagination slices the ranked page deterministically'
);

select extensions.is(
  (
    select array_agg(t.id order by t.ord)
    from (
      select listed.id, row_number() over () as ord
      from public.list_notes_for_library(
        null,
        (select id from public.subjects where slug = 'operating-systems'),
        'all',
        'all',
        'newest',
        10,
        0
      ) as listed
    ) as t
  ),
  array[
    '92929292-9292-4929-8929-929292929292'::uuid,
    '91919191-9191-4919-8919-919191919191'::uuid,
    '90909090-9090-4909-8909-909090909090'::uuid
  ],
  'newest sort keeps its deterministic published ordering'
);

select extensions.is(
  (
    select count(*)
    from public.list_notes_for_library(
      'fresh',
      (select id from public.subjects where slug = 'operating-systems'),
      'all',
      'all',
      'top',
      10,
      0
    ) as listed
  ),
  1::bigint,
  'title search narrows the accessible list'
);

select set_config(
  'request.jwt.claim.sub',
  '88888888-8888-4888-8888-888888888888',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select count(*)
    from public.list_notes_for_library(
      null,
      (select id from public.subjects where slug = 'data-structures'),
      'all',
      'all',
      'top',
      10,
      0
    ) as listed
    where listed.id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid
  ),
  0::bigint,
  'access is applied before ranking for students outside the university'
);

select set_config(
  'request.jwt.claim.sub',
  '77777777-7777-4777-8777-777777777777',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select count(*)
    from public.list_notes_for_library(
      null,
      (select id from public.subjects where slug = 'data-structures'),
      'all',
      'all',
      'top',
      10,
      0
    ) as listed
    where listed.id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid
  ),
  1::bigint,
  'a verified campus member sees the university note in the ranked list'
);

select extensions.is(
  (
    select result.success
    from public.rate_note(
      'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid,
      5::smallint
    ) as result
  ),
  true,
  'a verified campus member can rate the university note'
);

reset role;

update public.university_memberships
set status = 'pending', verified_at = null
where user_id = '77777777-7777-4777-8777-777777777777';

set local role authenticated;

select extensions.is(
  (
    select result.error_code
    from public.rate_note(
      'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid,
      4::smallint
    ) as result
  ),
  'not_permitted',
  'a student who loses membership cannot update the earlier rating'
);

select * from extensions.finish();

rollback;
