-- Run after 20260922000000_create_membership_review.sql. All fixtures roll back.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(23);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.membership_verification_requests', 'SELECT'),
  'student claims cannot be read directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.membership_verification_requests', 'UPDATE'),
  'review decisions cannot be edited directly'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.list_membership_verification_queue(integer)', 'EXECUTE'),
  'anonymous callers cannot list claims'
);
select extensions.ok(
  not has_function_privilege('authenticated',
    'public.complete_student_onboarding_initial(text,text,smallint,bigint,text,text)', 'EXECUTE'),
  'students cannot bypass the first-onboarding gate'
);
select extensions.ok(
  (select relrowsecurity and relforcerowsecurity from pg_class
   where oid = 'public.membership_verification_requests'::regclass),
  'claims table has forced RLS'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '71717171-7171-4171-8171-717171717101', 'authenticated', 'authenticated', 'reviewer@bennett.edu.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '71717171-7171-4171-8171-717171717102', 'authenticated', 'authenticated', 'student@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '71717171-7171-4171-8171-717171717103', 'authenticated', 'authenticated', 'outside@iitd.ac.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '71717171-7171-4171-8171-717171717104', 'authenticated', 'authenticated', 'second@example.com', '', now(), '{}', '{}', now(), now());

update public.profiles set onboarding_completed_at = now(), display_name = 'Review fixture'
where id::text like '71717171-7171-4171-8171-71717171710%';

insert into public.university_memberships (
  user_id, university_id, academic_email, status, role, verified_at
) values
  ('71717171-7171-4171-8171-717171717101', (select id from public.universities where slug = 'bennett-university'), 'reviewer@bennett.edu.in', 'verified', 'moderator', now()),
  ('71717171-7171-4171-8171-717171717102', (select id from public.universities where slug = 'bennett-university'), 'student@example.com', 'pending', 'student', null),
  ('71717171-7171-4171-8171-717171717103', (select id from public.universities where slug = 'iit-delhi'), 'outside@iitd.ac.in', 'verified', 'moderator', now()),
  ('71717171-7171-4171-8171-717171717104', (select id from public.universities where slug = 'bennett-university'), 'second@example.com', 'pending', 'student', null);

create temp table membership_review_test_state (student text, request_id uuid);
grant select, insert on membership_review_test_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '71717171-7171-4171-8171-717171717102', true);
insert into membership_review_test_state
select 'first', public.submit_membership_verification_request('BEN-2026-102', 'Please check the current student roster.');
select extensions.is((select count(*)::integer from public.list_own_membership_verification_requests()), 1,
  'student can see own submitted request');
select extensions.is((select count(*)::integer from public.list_membership_verification_queue()), 0,
  'ordinary student cannot list the review queue');
select extensions.throws_ok(
  $$select public.submit_membership_verification_request('BEN-2026-102', '')$$,
  '23505', 'A request is already pending', 'a second pending request is refused'
);

reset role;
insert into public.platform_roles (user_id, role)
values ('71717171-7171-4171-8171-717171717102', 'platform_moderator');
set local role authenticated;
select set_config('request.jwt.claim.sub', '71717171-7171-4171-8171-717171717102', true);
select extensions.throws_ok(
  $$select public.review_membership_verification_request(
    (select request_id from membership_review_test_state where student = 'first'),
    'approved', 'roster_check', 'Confirmed on campus roster')$$,
  '42501', 'Review is not permitted', 'even a platform reviewer cannot decide their own request'
);
reset role;
delete from public.platform_roles
where user_id = '71717171-7171-4171-8171-717171717102';
set local role authenticated;

select set_config('request.jwt.claim.sub', '71717171-7171-4171-8171-717171717103', true);
select extensions.is((select count(*)::integer from public.list_membership_verification_queue()), 0,
  'a reviewer from another campus sees no Bennett claims');
select extensions.throws_ok(
  $$select public.review_membership_verification_request(
    (select request_id from membership_review_test_state where student = 'first'),
    'approved', 'roster_check', 'Confirmed on campus roster')$$,
  '42501', 'Review is not permitted', 'a reviewer from another campus cannot approve'
);

select set_config('request.jwt.claim.sub', '71717171-7171-4171-8171-717171717101', true);
select extensions.is((select count(*)::integer from public.list_membership_verification_queue()), 1,
  'campus reviewer sees the pending claim');
select extensions.throws_ok(
  $$select public.review_membership_verification_request(
    (select request_id from membership_review_test_state where student = 'first'),
    'approved', 'insufficient_evidence', 'I did not check enrolment')$$,
  '22023', 'Invalid review decision', 'approval requires independent evidence'
);
select extensions.ok(
  public.review_membership_verification_request(
    (select request_id from membership_review_test_state where student = 'first'),
    'approved', 'roster_check', 'Confirmed against current university roster'),
  'campus reviewer can approve after checking the roster'
);
select extensions.ok(
  not public.review_membership_verification_request(
    (select request_id from membership_review_test_state where student = 'first'),
    'rejected', 'insufficient_evidence', 'This request was already reviewed'),
  'a decided request cannot be overwritten'
);

reset role;
select extensions.is(
  (select status from public.university_memberships
   where user_id = '71717171-7171-4171-8171-717171717102'),
  'verified', 'approval updates the membership used by campus access checks'
);
select extensions.is(
  (select evidence_method from public.membership_verification_requests
   where id = (select request_id from membership_review_test_state where student = 'first')),
  'roster_check', 'review evidence method is audited'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '71717171-7171-4171-8171-717171717102', true);
select extensions.throws_ok(
  -- 2028 without the cast is an integer, and with every other argument
  -- untyped there is no candidate to resolve against smallint. The call then
  -- failed with 42883 before it ever reached the guard this asserts.
  $$select * from public.complete_student_onboarding(
    'Student', 'B.Tech', 2028::smallint, (select id from public.universities where slug = 'bennett-university'),
    'ace_exams', 'solo')$$,
  '42501', 'Onboarding is already complete', 're-onboarding cannot reset a reviewed membership'
);
select extensions.throws_ok(
  $$select public.submit_membership_verification_request('BEN-2026-102', '')$$,
  '42501', 'This membership cannot be submitted for review', 'verified students cannot reapply'
);
select extensions.ok(
  public.has_verified_university_membership(
    (select id from public.universities where slug = 'bennett-university')),
  'approved student passes the existing campus access predicate'
);

select set_config('request.jwt.claim.sub', '71717171-7171-4171-8171-717171717104', true);
insert into membership_review_test_state
select 'second', public.submit_membership_verification_request('BEN-2026-104', 'Please check my enrolment.');
select set_config('request.jwt.claim.sub', '71717171-7171-4171-8171-717171717101', true);
select extensions.ok(
  public.review_membership_verification_request(
    (select request_id from membership_review_test_state where student = 'second'),
    'rejected', 'insufficient_evidence', 'No matching active enrolment was found'),
  'reviewer can reject an unsupported claim'
);

reset role;
select extensions.is(
  (select status from public.university_memberships
   where user_id = '71717171-7171-4171-8171-717171717104'),
  'rejected', 'rejection keeps campus access closed'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '71717171-7171-4171-8171-717171717104', true);
select extensions.ok(
  public.submit_membership_verification_request('BEN-2026-104B', 'I can provide an updated roster entry.') is not null,
  'a rejected student can submit corrected details for another review'
);

reset role;
select * from extensions.finish();
rollback;
