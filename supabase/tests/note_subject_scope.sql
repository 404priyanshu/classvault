-- Transactional pgTAP coverage for which subjects a note may be filed under.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(9);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '5c5c5c5c-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'subject-bennett@bennett.edu.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '5c5c5c5c-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'subject-iitd@iitd.ac.in', '', now(), '{}', '{}', now(), now());

update public.profiles
set display_name = 'Subject Student', onboarding_completed_at = now()
where id in ('5c5c5c5c-0000-4000-8000-000000000001', '5c5c5c5c-0000-4000-8000-000000000002');

insert into public.university_memberships (
  user_id, university_id, academic_email, status, role, verified_at
)
values
  ('5c5c5c5c-0000-4000-8000-000000000001', (select id from public.universities where slug = 'bennett-university'), 'subject-bennett@bennett.edu.in', 'verified', 'student', now()),
  ('5c5c5c5c-0000-4000-8000-000000000002', (select id from public.universities where slug = 'iit-delhi'), 'subject-iitd@iitd.ac.in', 'verified', 'student', now());

-- A course another campus created, which Bennett students must not file under.
insert into public.subjects (name, slug, university_id)
values ('Delhi Only Course', 'delhi-only-course', (select id from public.universities where slug = 'iit-delhi'));

create temp table subject_scope_state (
  singleton boolean primary key default true,
  subject_id bigint,
  other_campus_subject_id bigint,
  public_note_id uuid
);
-- Looked up here: the Bennett student cannot see this row, so a lookup under
-- their role would pass a null and test the wrong refusal.
insert into subject_scope_state (other_campus_subject_id)
select id from public.subjects where slug = 'delhi-only-course';
grant all on subject_scope_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '5c5c5c5c-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"5c5c5c5c-0000-4000-8000-000000000001","role":"authenticated"}', true);

-- The course a Bennett student types that the catalog does not have yet.
update subject_scope_state
set subject_id = (select id from public.find_or_create_subject('Compiler Construction'));

select extensions.ok(
  (select university_id from public.subjects where id = (select subject_id from subject_scope_state))
    = (select id from public.universities where slug = 'bennett-university'),
  'a new subject is still created for the student''s own campus'
);

-- The bug: this is the upload form's default, and it used to be refused.
update subject_scope_state
set public_note_id = (
  select note_id from public.create_note_upload_draft(
    'Public note on a new course', null,
    (select subject_id from subject_scope_state),
    'lecture_notes', array[]::text[], 'public',
    'notes.pdf', 'application/pdf', 1024, repeat('a', 64)
  )
);
select extensions.ok(
  (select public_note_id from subject_scope_state) is not null,
  'a public note can be filed under a subject its uploader''s campus created'
);

select extensions.lives_ok(
  $$select public.create_note_upload_draft(
    'Campus note on a new course', null,
    (select subject_id from subject_scope_state),
    'lecture_notes', array[]::text[], 'university',
    'notes.pdf', 'application/pdf', 1024, repeat('b', 64)
  )$$,
  'a campus-only note on its own campus subject still works'
);

select extensions.throws_ok(
  $$select public.create_note_upload_draft(
    'Public note on another campus course', null,
    (select other_campus_subject_id from subject_scope_state),
    'lecture_notes', array[]::text[], 'public',
    'notes.pdf', 'application/pdf', 1024, repeat('c', 64)
  )$$,
  '23514',
  'Subject does not match note access scope',
  'a public note cannot borrow another campus''s subject'
);

select extensions.throws_ok(
  $$select public.create_note_upload_draft(
    'Campus note on another campus course', null,
    (select other_campus_subject_id from subject_scope_state),
    'lecture_notes', array[]::text[], 'university',
    'notes.pdf', 'application/pdf', 1024, repeat('d', 64)
  )$$,
  '23514',
  'Subject does not match note access scope',
  'a campus-only note cannot borrow another campus''s subject'
);

reset role;

-- The trigger holds the same line for writes that skip the RPC.
select extensions.throws_ok(
  $$insert into public.notes (owner_id, subject_id, visibility, title, note_type)
    values (
      '5c5c5c5c-0000-4000-8000-000000000001',
      (select id from public.subjects where slug = 'delhi-only-course'),
      'public', 'Direct insert', 'lecture_notes'
    )$$,
  '23514',
  'University subject does not match note scope',
  'the subject-scope trigger refuses another campus''s subject on a public note'
);

select extensions.throws_ok(
  $$update public.notes
    set subject_id = (select id from public.subjects where slug = 'delhi-only-course')
    where id = (select public_note_id from subject_scope_state)$$,
  '23514',
  'University subject does not match note scope',
  'a public note cannot be moved onto another campus''s subject later'
);

-- Publish the public note directly so another campus can see it.
update public.notes
set publication_status = 'published', published_at = now()
where id = (select public_note_id from subject_scope_state);

select extensions.lives_ok(
  $$update public.university_memberships
    set university_id = (select id from public.universities where slug = 'iit-delhi')
    where user_id = '5c5c5c5c-0000-4000-8000-000000000001';
    update public.notes set publication_status = 'published'
    where id = (select public_note_id from subject_scope_state)$$,
  'an owner who moves campus does not strand their existing public notes'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '5c5c5c5c-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"5c5c5c5c-0000-4000-8000-000000000002","role":"authenticated"}', true);

select extensions.is(
  (select name from public.subjects where id = (select subject_id from subject_scope_state)),
  'Compiler Construction',
  'a student at another campus can read the subject of a public note filed under it'
);

reset role;
select * from extensions.finish();
rollback;
