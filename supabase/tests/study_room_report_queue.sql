-- Transactional pgTAP coverage for the study-room report queue. See ADR 0030.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(16);

create temp table report_queue_state (
  room_id uuid primary key,
  message_id bigint,
  report_id uuid
);
grant all on report_queue_state to authenticated, anon;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'cdcdcdcd-0000-4000-8000-00000000b001', 'authenticated', 'authenticated', 'queuehost@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cdcdcdcd-0000-4000-8000-00000000b002', 'authenticated', 'authenticated', 'queuerowdy@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cdcdcdcd-0000-4000-8000-00000000b003', 'authenticated', 'authenticated', 'queuemod@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cdcdcdcd-0000-4000-8000-00000000b004', 'authenticated', 'authenticated', 'queueadmin@example.com', '', now(), '{}', '{}', now(), now());

update public.profiles
set onboarding_completed_at = now(),
    display_name = split_part((select email from auth.users where id = profiles.id), '@', 1)
where id in (
  'cdcdcdcd-0000-4000-8000-00000000b001',
  'cdcdcdcd-0000-4000-8000-00000000b002',
  'cdcdcdcd-0000-4000-8000-00000000b003',
  'cdcdcdcd-0000-4000-8000-00000000b004'
);

insert into public.platform_roles (user_id, role)
values
  ('cdcdcdcd-0000-4000-8000-00000000b003', 'platform_moderator'),
  ('cdcdcdcd-0000-4000-8000-00000000b004', 'platform_admin');

select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_room_reports', 'SELECT'),
  'the queue is reachable only through its function, not the table'
);

-- A room, an offence, and a report, exactly as the room surface files one.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'cdcdcdcd-0000-4000-8000-00000000b001', true);
select set_config('request.jwt.claims', '{"sub":"cdcdcdcd-0000-4000-8000-00000000b001","role":"authenticated"}', true);
insert into report_queue_state (room_id)
select public.create_study_room(
  'Queue review room', 'Computer Networks', 'public', 25::smallint, 5::smallint
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cdcdcdcd-0000-4000-8000-00000000b002', true);
select set_config('request.jwt.claims', '{"sub":"cdcdcdcd-0000-4000-8000-00000000b002","role":"authenticated"}', true);
select public.join_study_room((select room_id from report_queue_state));
update report_queue_state
set message_id = public.send_study_room_message(
  (select room_id from report_queue_state), 'nobody here can read'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cdcdcdcd-0000-4000-8000-00000000b001', true);
select set_config('request.jwt.claims', '{"sub":"cdcdcdcd-0000-4000-8000-00000000b001","role":"authenticated"}', true);
select public.report_study_room_participant(
  (select room_id from report_queue_state),
  'cdcdcdcd-0000-4000-8000-00000000b002',
  'harassment',
  'Abusive to the room',
  array[(select message_id from report_queue_state)]
);

-- A student who is not staff sees an empty queue, not someone else's report.
select extensions.is(
  (select count(*) from public.list_study_room_reports(100)),
  0::bigint,
  'an ordinary student sees no reports, including the one they filed'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cdcdcdcd-0000-4000-8000-00000000b003', true);
select set_config('request.jwt.claims', '{"sub":"cdcdcdcd-0000-4000-8000-00000000b003","role":"authenticated"}', true);
update report_queue_state
set report_id = (select report_id from public.list_study_room_reports(100) limit 1);

select extensions.is(
  (select count(*) from public.list_study_room_reports(100)),
  1::bigint,
  'a platform moderator sees the report'
);
select extensions.is(
  (select reported_label from public.list_study_room_reports(100)),
  'queuerowdy',
  'the queue names the reported participant by label'
);
select extensions.is(
  (select reporter_label from public.list_study_room_reports(100)),
  'queuehost',
  'the queue names the reporter by label'
);
select extensions.is(
  (select cited_messages -> 0 ->> 'body' from public.list_study_room_reports(100)),
  'nobody here can read',
  'the cited message travels with the report'
);
select extensions.ok(
  (select room_still_live from public.list_study_room_reports(100)),
  'the queue says the room is still live while it is'
);

-- Closing is the decision that ends review, so it has to be accounted for.
select extensions.ok(
  not public.set_study_room_report_status(
    (select report_id from report_queue_state), 'closed', '   '),
  'closing a report needs a note saying what was decided'
);
select extensions.ok(
  not public.set_study_room_report_status(
    (select report_id from report_queue_state), 'deleted', 'Getting rid of it'),
  'a report cannot be moved to a status the workflow does not have'
);
select extensions.ok(
  public.set_study_room_report_status(
    (select report_id from report_queue_state), 'reviewing', 'Looking at the chat'),
  'a moderator can take a report under review'
);
select extensions.is(
  (select reviewer_label from public.list_study_room_reports(100)),
  'queuemod',
  'the queue records who took it'
);

-- Suspension is the administrator's, not the moderator's.
select extensions.ok(
  not public.suspend_study_room_reported_user(
    (select report_id from report_queue_state), 'Abusive in a room'),
  'a moderator cannot suspend the account a report names'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cdcdcdcd-0000-4000-8000-00000000b004', true);
select set_config('request.jwt.claims', '{"sub":"cdcdcdcd-0000-4000-8000-00000000b004","role":"authenticated"}', true);
select extensions.ok(
  public.suspend_study_room_reported_user(
    (select report_id from report_queue_state), 'Abusive in a room'),
  'an administrator can suspend by report, without handling the id'
);
select extensions.ok(
  (select reported_suspended from public.list_study_room_reports(100)),
  'the queue shows that the account is now suspended'
);
select extensions.ok(
  public.set_study_room_report_status(
    (select report_id from report_queue_state), 'closed', 'Suspended the account'),
  'closing with a note leaves the queue'
);
select extensions.is(
  (select count(*) from public.list_study_room_reports(100)),
  0::bigint,
  'a closed report is out of the queue'
);

select * from extensions.finish();
rollback;
