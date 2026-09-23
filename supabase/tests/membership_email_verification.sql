-- Transactional pgTAP coverage for verifying a campus membership from a
-- confirmed email that arrives after onboarding.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(7);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '7e7e7e7e-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'riya@gmail.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '7e7e7e7e-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'arjun@gmail.com', '', now(), '{}', '{}', now(), now());

insert into public.university_memberships (user_id, university_id, academic_email, status, role)
values
  ('7e7e7e7e-0000-4000-8000-000000000001', (select id from public.universities where slug = 'bennett-university'), null, 'pending', 'student'),
  ('7e7e7e7e-0000-4000-8000-000000000002', (select id from public.universities where slug = 'bennett-university'), null, 'rejected', 'student');

select extensions.ok(
  not has_function_privilege('authenticated', 'public.verify_membership_from_confirmed_email(uuid)', 'EXECUTE'),
  'students cannot call the verifier for an arbitrary account'
);

-- A confirmed change to a non-campus address changes nothing.
update auth.users set email = 'riya.other@gmail.com'
where id = '7e7e7e7e-0000-4000-8000-000000000001';
select extensions.is(
  (select status from public.university_memberships where user_id = '7e7e7e7e-0000-4000-8000-000000000001'),
  'pending',
  'a non-campus address leaves the membership pending'
);

-- GoTrue writes the new address once the change is confirmed.
update auth.users set email = 'riya.s@bennett.edu.in'
where id = '7e7e7e7e-0000-4000-8000-000000000001';
select extensions.is(
  (select status from public.university_memberships where user_id = '7e7e7e7e-0000-4000-8000-000000000001'),
  'verified',
  'a confirmed campus address verifies a pending membership'
);
select extensions.is(
  (select academic_email from public.university_memberships where user_id = '7e7e7e7e-0000-4000-8000-000000000001'),
  'riya.s@bennett.edu.in',
  'the campus address is recorded as the academic email'
);

update auth.users set email = 'arjun@student.bennett.edu.in'
where id = '7e7e7e7e-0000-4000-8000-000000000002';
select extensions.is(
  (select status from public.university_memberships where user_id = '7e7e7e7e-0000-4000-8000-000000000002'),
  'verified',
  'a campus subdomain address overrides an earlier rejected review'
);

-- Moving back off the campus domain keeps the verification already earned.
update auth.users set email = 'riya@gmail.com'
where id = '7e7e7e7e-0000-4000-8000-000000000001';
select extensions.is(
  (select status from public.university_memberships where user_id = '7e7e7e7e-0000-4000-8000-000000000001'),
  'verified',
  'leaving the campus domain later does not revoke verification'
);

-- An unconfirmed address never verifies anything.
update public.university_memberships set status = 'pending', verified_at = null
where user_id = '7e7e7e7e-0000-4000-8000-000000000002';
update auth.users set email_confirmed_at = null
where id = '7e7e7e7e-0000-4000-8000-000000000002';
select extensions.is(
  (select status from public.university_memberships where user_id = '7e7e7e7e-0000-4000-8000-000000000002'),
  'pending',
  'an unconfirmed campus address does not verify'
);

select * from extensions.finish();
rollback;
