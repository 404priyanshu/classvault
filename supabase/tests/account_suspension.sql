-- Transactional pgTAP coverage for account suspension as an access restriction.
--
-- The point of ADR 0011 is that suspension closes access and leaves content
-- alone, so this asserts both halves: a suspended student cannot act, and their
-- published note stays exactly as readable to everyone else as it was.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(31);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.account_suspension_actions', 'SELECT'),
  'students cannot read the suspension audit trail directly'
);
select extensions.ok(
  (select relrowsecurity and relforcerowsecurity from pg_class
   where oid = 'public.account_suspension_actions'::regclass),
  'the suspension audit trail has forced RLS'
);
select extensions.ok(
  not has_function_privilege('anon',
    'public.set_account_suspension(uuid,boolean,text)', 'EXECUTE'),
  'anonymous callers cannot suspend anyone'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.get_own_account_status()', 'EXECUTE'),
  'anonymous callers cannot read account status'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '5a5a5a5a-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'student@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '5a5a5a5a-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'peer@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '5a5a5a5a-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'admin@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '5a5a5a5a-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'mod@example.com', '', now(), '{}', '{}', now(), now());

update public.profiles
set onboarding_completed_at = now()
where id in (
  '5a5a5a5a-0000-4000-8000-000000000001',
  '5a5a5a5a-0000-4000-8000-000000000002',
  '5a5a5a5a-0000-4000-8000-000000000003',
  '5a5a5a5a-0000-4000-8000-000000000004'
);

insert into public.platform_roles (user_id, role)
values
  ('5a5a5a5a-0000-4000-8000-000000000003', 'platform_admin'),
  ('5a5a5a5a-0000-4000-8000-000000000004', 'platform_moderator');

insert into public.notes (
  id, owner_id, subject_id, visibility, title, note_type,
  tags, publication_status, published_at
)
values (
  '5a5a5a5a-0000-4000-8000-00000000ff00',
  '5a5a5a5a-0000-4000-8000-000000000001',
  (select id from public.subjects where slug = 'operating-systems' limit 1),
  'public', 'Note from a student who gets suspended', 'summary',
  array['testing'], 'published', now()
);

-- Before suspension the student is an ordinary, eligible student.
set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000001","role":"authenticated"}', true);
select extensions.ok(public.is_notes_eligible(), 'an active student can act on notes');
select extensions.ok(public.is_study_room_eligible(), 'an active student can act on rooms');
select extensions.ok(not public.is_account_suspended(), 'an active student is not suspended');

-- A moderator is not enough: ADR 0011 puts this with administrators.
set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000004","role":"authenticated"}', true);
select extensions.ok(
  not public.set_account_suspension('5a5a5a5a-0000-4000-8000-000000000001', true, 'Trying it on'),
  'a platform moderator cannot suspend an account'
);

-- Nor can an ordinary peer.
set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000002","role":"authenticated"}', true);
select extensions.ok(
  not public.set_account_suspension('5a5a5a5a-0000-4000-8000-000000000001', true, 'Personal dispute'),
  'an ordinary student cannot suspend another student'
);
select extensions.is(
  (select count(*) from public.profiles
   where id = '5a5a5a5a-0000-4000-8000-000000000001' and suspended_at is not null),
  0::bigint,
  'refused attempts leave the account untouched'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000003","role":"authenticated"}', true);
select extensions.ok(
  not public.set_account_suspension('5a5a5a5a-0000-4000-8000-000000000001', true, '   '),
  'a suspension needs a reason'
);
select extensions.ok(
  not public.set_account_suspension('5a5a5a5a-0000-4000-8000-000000000003', true, 'Locking myself out'),
  'an administrator cannot suspend themselves'
);
select extensions.ok(
  public.set_account_suspension(
    '5a5a5a5a-0000-4000-8000-000000000001', true, 'Repeated abusive messages in rooms'),
  'an administrator can suspend a student'
);
select extensions.ok(
  not public.set_account_suspension(
    '5a5a5a5a-0000-4000-8000-000000000001', true, 'Same again'),
  'suspending an already suspended account changes nothing'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.is(
  (select action from public.account_suspension_actions
   where user_id = '5a5a5a5a-0000-4000-8000-000000000001' order by id desc limit 1),
  'suspended',
  'the decision is recorded in the audit trail'
);
select extensions.is(
  (select actor_id from public.account_suspension_actions
   where user_id = '5a5a5a5a-0000-4000-8000-000000000001' order by id desc limit 1),
  '5a5a5a5a-0000-4000-8000-000000000003'::uuid,
  'the audit trail records who decided'
);

-- The suspended student: no access, but told why.
set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000001","role":"authenticated"}', true);
select extensions.ok(public.is_account_suspended(), 'the student is suspended');
select extensions.ok(not public.is_notes_eligible(), 'a suspended student cannot act on notes');
select extensions.ok(not public.is_study_room_eligible(), 'a suspended student cannot act on rooms');
select extensions.is(
  (select suspension_reason from public.get_own_account_status()),
  'Repeated abusive messages in rooms',
  'the student can read the reason for their own suspension'
);

-- ADR 0011: access is closed, content is not touched.
set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000002","role":"authenticated"}', true);
select extensions.ok(
  public.can_consume_note('5a5a5a5a-0000-4000-8000-00000000ff00'),
  'a suspended student''s published note stays readable by peers'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.is(
  (select publication_status from public.notes
   where id = '5a5a5a5a-0000-4000-8000-00000000ff00'),
  'published',
  'suspension does not change publication state'
);

-- Restoration returns the student to normal.
set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000003","role":"authenticated"}', true);
select extensions.ok(
  public.set_account_suspension(
    '5a5a5a5a-0000-4000-8000-000000000001', false, 'Appeal upheld'),
  'an administrator can lift a suspension'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000001","role":"authenticated"}', true);
select extensions.ok(public.is_notes_eligible(), 'a restored student can act on notes again');
select extensions.ok(
  (select not suspended from public.get_own_account_status()),
  'a restored student no longer reads as suspended'
);

-- The administrator surface: suspend by note, lift from the list.
set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000004","role":"authenticated"}', true);
select extensions.ok(
  not public.suspend_note_owner('5a5a5a5a-0000-4000-8000-00000000ff00', 'Moderator overreach'),
  'a moderator cannot suspend a note owner'
);
select extensions.is(
  (select count(*) from public.list_suspended_accounts()),
  0::bigint,
  'a moderator sees no suspended accounts'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '5a5a5a5a-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"5a5a5a5a-0000-4000-8000-000000000003","role":"authenticated"}', true);
select extensions.ok(
  public.suspend_note_owner(
    '5a5a5a5a-0000-4000-8000-00000000ff00', 'Suspended from the moderation queue'),
  'an administrator can suspend the owner of a note'
);
select extensions.is(
  (select user_id from public.list_suspended_accounts()),
  '5a5a5a5a-0000-4000-8000-000000000001'::uuid,
  'the suspended account appears on the administrator list'
);
select extensions.is(
  (select decided_by_label from public.list_suspended_accounts()),
  (select display_name from public.profiles
   where id = '5a5a5a5a-0000-4000-8000-000000000003'),
  'the list names who decided'
);
select extensions.ok(
  not public.suspend_note_owner(
    '5a5a5a5a-0000-4000-8000-00000000ffff', 'No such note'),
  'suspending by an unknown note is refused'
);

select * from extensions.finish();
rollback;
