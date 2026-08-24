-- Transactional pgTAP coverage for report intake and scoped moderation actions.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(20);

select extensions.ok(
  has_function_privilege('authenticated', 'public.report_note(uuid,text,text)', 'EXECUTE'),
  'authenticated students can submit reports through the server-owned function'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.report_note(uuid,text,text)', 'EXECUTE'),
  'anonymous users cannot submit reports'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.moderate_note(uuid,text,text,text)', 'EXECUTE'),
  'authenticated users can request moderation actions subject to scope checks'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.moderate_note(uuid,text,text,text)', 'EXECUTE'),
  'anonymous users cannot request moderation actions'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777771', 'authenticated', 'authenticated', 'report-owner@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777772', 'authenticated', 'authenticated', 'reporter@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777773', 'authenticated', 'authenticated', 'moderator@example.com', '', now(), '{}', '{}', now(), now());

update public.profiles
set onboarding_completed_at = now()
where id in (
  '77777777-7777-4777-8777-777777777771',
  '77777777-7777-4777-8777-777777777772',
  '77777777-7777-4777-8777-777777777773'
);

insert into public.platform_roles (user_id, role)
values ('77777777-7777-4777-8777-777777777773', 'platform_moderator');

insert into public.notes (
  id, owner_id, subject_id, visibility, title, note_type,
  tags, publication_status, published_at
)
values (
  '77777777-7777-4777-8777-777777777770',
  '77777777-7777-4777-8777-777777777771',
  (select id from public.subjects where slug = 'operating-systems' limit 1),
  'public', 'Moderation test note', 'summary', array['testing'], 'published', now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777772', true);
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777772","role":"authenticated"}', true);

select extensions.is(
  (select success from public.report_note('77777777-7777-4777-8777-777777777770', 'spam', 'Duplicate upload') limit 1),
  true,
  'an eligible reader can report an accessible note'
);
select extensions.is(
  (select error_code from public.report_note('77777777-7777-4777-8777-777777777770', 'spam', 'Again') limit 1),
  'already_reported',
  'a reader cannot create a second open report for the same note'
);
select extensions.is(
  (select error_code from public.report_note('77777777-7777-4777-8777-777777777770', 'invalid', null) limit 1),
  'invalid_category',
  'invalid report categories are rejected'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777771', true);
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777771","role":"authenticated"}', true);
select extensions.is(
  (select error_code from public.report_note('77777777-7777-4777-8777-777777777770', 'spam', null) limit 1),
  'self_report_forbidden',
  'owners cannot report their own note'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777773', true);
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777773","role":"authenticated"}', true);

select extensions.is(
  (select count(*) from public.list_moderation_queue(50) where note_id = '77777777-7777-4777-8777-777777777770'),
  1::bigint,
  'moderators see reports in the scoped queue'
);
select extensions.is(
  (select success from public.moderate_note('77777777-7777-4777-8777-777777777770', 'start_review', 'spam', 'We are reviewing this report.') limit 1),
  true,
  'moderators can start a review'
);
select extensions.is(
  (select moderation_status from public.notes where id = '77777777-7777-4777-8777-777777777770'),
  'under_review',
  'starting review updates note moderation state'
);
select extensions.is(
  (select status from public.note_reports where note_id = '77777777-7777-4777-8777-777777777770' limit 1),
  'reviewing',
  'starting review updates report state'
);
select extensions.is(
  (select success from public.moderate_note('77777777-7777-4777-8777-777777777770', 'clear_review', 'cleared', 'The report was reviewed and dismissed.') limit 1),
  true,
  'moderators can clear a reviewed note'
);

set local role postgres;
select extensions.is(
  (select status from public.note_reports where note_id = '77777777-7777-4777-8777-777777777770' limit 1),
  'dismissed',
  'clearing review dismisses active reports'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777772', true);
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777772","role":"authenticated"}', true);
select extensions.is(
  (select success from public.report_note('77777777-7777-4777-8777-777777777770', 'unsafe_file', 'Second report') limit 1),
  true,
  'a resolved reporter can submit a later report'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777773', true);
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777773","role":"authenticated"}', true);
select extensions.is(
  (select success from public.moderate_note('77777777-7777-4777-8777-777777777770', 'restrict', 'unsafe_file', 'This note is temporarily unavailable while we check the file.') limit 1),
  true,
  'moderators can restrict a note'
);
select extensions.is(
  (select moderation_status from public.notes where id = '77777777-7777-4777-8777-777777777770'),
  'restricted',
  'restricting a note blocks its moderation state'
);
select extensions.ok(
  not public.can_consume_note('77777777-7777-4777-8777-777777777770'),
  'restricted notes cannot be consumed'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777771', true);
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777771","role":"authenticated"}', true);
select extensions.is(
  (select count(*) from public.list_owned_note_moderation_notices() where note_id = '77777777-7777-4777-8777-777777777770'),
  1::bigint,
  'owners can see safe moderation notices for their notes'
);
select extensions.is(
  (select safe_owner_message from public.list_owned_note_moderation_notices() where note_id = '77777777-7777-4777-8777-777777777770'),
  'This note is temporarily unavailable while we check the file.',
  'owner notices expose only the safe moderator message'
);

select * from extensions.finish();
rollback;
