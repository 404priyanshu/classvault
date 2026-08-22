-- Transactional pgTAP coverage for owner note lifecycle and privileged purge.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(22);

select extensions.ok(
  has_function_privilege('authenticated', 'public.list_owned_notes(boolean)', 'EXECUTE'),
  'authenticated owners can list their lifecycle metadata'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.delete_note(uuid)', 'EXECUTE'),
  'authenticated owners can request soft deletion'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.restore_note(uuid)', 'EXECUTE'),
  'authenticated owners can request restoration'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.claim_expired_note_purges(integer)', 'EXECUTE'),
  'authenticated users cannot claim purge work'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.finalize_note_purge(uuid)', 'EXECUTE'),
  'authenticated users cannot finalize purge work'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.delete_note(uuid)', 'EXECUTE'),
  'anonymous users cannot request note deletion'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '99999999-9999-4999-8999-999999999999',
    'authenticated', 'authenticated', 'lifecycle-owner@example.com', '', now(), '{}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '99999999-9999-4999-8999-999999999998',
    'authenticated', 'authenticated', 'lifecycle-other@example.com', '', now(), '{}', '{}', now(), now()
  );

update public.profiles
set onboarding_completed_at = now()
where id in (
  '99999999-9999-4999-8999-999999999999',
  '99999999-9999-4999-8999-999999999998'
);

insert into public.notes (
  id, owner_id, subject_id, visibility, title, description, note_type,
  tags, publication_status, published_at
)
values (
  '99999999-9999-4999-8999-999999999997',
  '99999999-9999-4999-8999-999999999999',
  (select id from public.subjects where slug = 'operating-systems' limit 1),
  'public', 'Lifecycle test note', 'A note for lifecycle tests', 'summary',
  array['testing'], 'published', now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999999', true);
select set_config('request.jwt.claims', '{"sub":"99999999-9999-4999-8999-999999999999","role":"authenticated"}', true);

select extensions.is(
  (select count(*) from public.list_owned_notes(false) where note_id = '99999999-9999-4999-8999-999999999997'),
  1::bigint,
  'owners see active notes in My Vault'
);
select extensions.is(
  (select count(*) from public.list_owned_notes(true) where note_id = '99999999-9999-4999-8999-999999999997'),
  0::bigint,
  'active notes do not appear in Trash'
);

select extensions.is(
  (select count(*) from public.delete_note('99999999-9999-4999-8999-999999999997')),
  1::bigint,
  'owner deletion returns the recovery deadline'
);
select extensions.is(
  (select count(*) from public.list_owned_notes(false) where note_id = '99999999-9999-4999-8999-999999999997'),
  0::bigint,
  'deleted notes leave active owner views'
);
select extensions.is(
  (select count(*) from public.list_owned_notes(true) where note_id = '99999999-9999-4999-8999-999999999997'),
  1::bigint,
  'owners see deleted notes in Trash'
);
select extensions.ok(
  not public.can_consume_note('99999999-9999-4999-8999-999999999997'),
  'deleted notes cannot be consumed'
);

select extensions.is(
  (select success from public.restore_note('99999999-9999-4999-8999-999999999997')),
  true,
  'owners can restore notes before the deadline'
);
select extensions.is(
  (select count(*) from public.list_owned_notes(false) where note_id = '99999999-9999-4999-8999-999999999997'),
  1::bigint,
  'restored notes return to active owner views'
);

set local role postgres;
update public.notes
set deleted_at = now() - interval '31 days',
    purge_after = now() - interval '1 day'
where id = '99999999-9999-4999-8999-999999999997';
set local role authenticated;

select extensions.is(
  (select error_code from public.restore_note('99999999-9999-4999-8999-999999999997')),
  'recovery_expired',
  'expired notes cannot be restored'
);

set local role postgres;
select extensions.is(
  (select count(*) from public.claim_expired_note_purges(25) where note_id = '99999999-9999-4999-8999-999999999997'),
  1::bigint,
  'privileged purge claims include expired notes'
);
select extensions.is(
  (select public.finalize_note_purge('99999999-9999-4999-8999-999999999997')),
  true,
  'purge finalization removes metadata after storage is absent'
);
select extensions.is(
  (select count(*) from public.notes where id = '99999999-9999-4999-8999-999999999997'),
  0::bigint,
  'purged notes remove authoritative metadata'
);

insert into public.notes (
  id, owner_id, subject_id, visibility, title, note_type,
  tags, publication_status, published_at, deleted_at, purge_after, retention_hold
)
values (
  '99999999-9999-4999-8999-999999999996',
  '99999999-9999-4999-8999-999999999999',
  (select id from public.subjects where slug = 'operating-systems' limit 1),
  'public', 'Held lifecycle test note', 'summary', array['testing'],
  'published', now(), now() - interval '31 days', now() - interval '1 day', true
);

select extensions.is(
  (select count(*) from public.claim_expired_note_purges(25) where note_id = '99999999-9999-4999-8999-999999999996'),
  0::bigint,
  'retention holds exclude notes from purge claims'
);

select extensions.is(
  (select count(*) from public.list_owned_notes(true) where note_id = '99999999-9999-4999-8999-999999999996'),
  1::bigint,
  'retention-held notes remain visible in Trash'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999998', true);
select set_config('request.jwt.claims', '{"sub":"99999999-9999-4999-8999-999999999998","role":"authenticated"}', true);

select extensions.throws_ok(
  $$select public.delete_note('99999999-9999-4999-8999-999999999996')$$,
  '42501',
  'Note is unavailable',
  'a non-owner cannot delete another student note'
);

set local role postgres;
select extensions.is(
  (select count(*) from public.notes where id = '99999999-9999-4999-8999-999999999996'),
  1::bigint,
  'retention-held metadata is preserved'
);

select * from extensions.finish();
rollback;
