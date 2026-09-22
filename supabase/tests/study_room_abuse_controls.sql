-- Transactional pgTAP coverage for room-scoped abuse controls. See ADR 0030.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(31);

create temp table room_abuse_state (
  room_id uuid primary key,
  message_id bigint
);
grant all on room_abuse_state to authenticated, anon;

select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_room_restrictions', 'SELECT'),
  'students cannot read room restrictions directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_room_reports', 'SELECT'),
  'students cannot read room reports directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_room_report_messages', 'SELECT'),
  'cited messages are not readable by students'
);
select extensions.ok(
  (select relrowsecurity and relforcerowsecurity from pg_class
   where oid = 'public.study_room_moderation_actions'::regclass),
  'the room moderation audit trail has forced RLS'
);
select extensions.ok(
  not has_function_privilege('anon',
    'public.remove_study_room_member(uuid,uuid,text)', 'EXECUTE'),
  'anonymous callers cannot remove participants'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'abababab-0000-4000-8000-00000000a001', 'authenticated', 'authenticated', 'host@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-0000-4000-8000-00000000a002', 'authenticated', 'authenticated', 'rowdy@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-0000-4000-8000-00000000a003', 'authenticated', 'authenticated', 'bystander@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-0000-4000-8000-00000000a004', 'authenticated', 'authenticated', 'staff@example.com', '', now(), '{}', '{}', now(), now());

update public.profiles
set onboarding_completed_at = now(),
    display_name = split_part((select email from auth.users where id = profiles.id), '@', 1)
where id in (
  'abababab-0000-4000-8000-00000000a001',
  'abababab-0000-4000-8000-00000000a002',
  'abababab-0000-4000-8000-00000000a003',
  'abababab-0000-4000-8000-00000000a004'
);

insert into public.platform_roles (user_id, role)
values ('abababab-0000-4000-8000-00000000a004', 'platform_moderator');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a001', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a001","role":"authenticated"}', true);
insert into room_abuse_state (room_id)
select public.create_study_room(
  'Abuse control room', 'Operating Systems', 'public', 25::smallint, 5::smallint
);

select extensions.ok(
  public.can_control_study_room((select room_id from room_abuse_state)),
  'the host can use room controls'
);

-- Everyone else joins.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a002', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a002","role":"authenticated"}', true);
select public.join_study_room((select room_id from room_abuse_state));
update room_abuse_state
set message_id = public.send_study_room_message(
  (select room_id from room_abuse_state), 'You are all terrible at this'
);
select extensions.ok(
  not public.can_control_study_room((select room_id from room_abuse_state)),
  'an ordinary member cannot use room controls'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a003', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a003","role":"authenticated"}', true);
select public.join_study_room((select room_id from room_abuse_state));

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a004', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a004","role":"authenticated"}', true);
select public.join_study_room((select room_id from room_abuse_state));

-- A bystander reports, citing the message.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a003', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a003","role":"authenticated"}', true);
select extensions.ok(
  public.report_study_room_participant(
    (select room_id from room_abuse_state),
    'abababab-0000-4000-8000-00000000a002',
    'harassment',
    'Abusive in chat',
    array[(select message_id from room_abuse_state)]
  ),
  'a member can report another participant'
);
select extensions.ok(
  not public.report_study_room_participant(
    (select room_id from room_abuse_state),
    'abababab-0000-4000-8000-00000000a003',
    'harassment', 'Reporting myself', '{}'
  ),
  'a member cannot report themselves'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.is(
  (select count(*) from public.study_room_report_messages),
  1::bigint,
  'the report copies the message it cites'
);
select extensions.is(
  (select body from public.study_room_report_messages),
  'You are all terrible at this',
  'the copied message keeps its text for the reviewer'
);
select extensions.is(
  (select room_name_snapshot from public.study_room_reports),
  'Abuse control room',
  'the report keeps the room name, which is deleted with the room'
);

-- Mute: the host withdraws chat, and the database enforces it.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a001', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a001","role":"authenticated"}', true);
select extensions.ok(
  not public.set_study_room_mute(
    (select room_id from room_abuse_state),
    'abababab-0000-4000-8000-00000000a004', true, 'Silencing the reviewer'),
  'a host cannot mute platform staff'
);
select extensions.ok(
  not public.set_study_room_mute(
    (select room_id from room_abuse_state),
    'abababab-0000-4000-8000-00000000a002', true, '  '),
  'muting needs a reason'
);
select extensions.ok(
  public.set_study_room_mute(
    (select room_id from room_abuse_state),
    'abababab-0000-4000-8000-00000000a002', true, 'Abusive in chat'),
  'a host can mute a participant'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a002', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a002","role":"authenticated"}', true);
select extensions.ok(
  public.is_muted_in_study_room((select room_id from room_abuse_state)),
  'the muted participant reads as muted'
);
select extensions.throws_ok(
  $$select public.send_study_room_message(
      (select room_id from room_abuse_state), 'Let me back in')$$,
  '42501',
  'You cannot post in this room',
  'a muted participant cannot post'
);

-- A control nobody can read is not a control. The muted student has to learn
-- they are muted without writing a message first, and the host has to be able
-- to see the mute in order to lift it -- while the rest of the room does not.
select extensions.is(
  public.get_study_room_snapshot((select room_id from room_abuse_state)) ->> 'viewerMuted',
  'true',
  'the muted student is told they are muted'
);
select extensions.is(
  public.get_study_room_snapshot((select room_id from room_abuse_state)) -> 'mutedUserIds',
  '[]'::jsonb,
  'an ordinary member is not shown who else is muted'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a001', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a001","role":"authenticated"}', true);
select extensions.is(
  public.get_study_room_snapshot((select room_id from room_abuse_state)) -> 'mutedUserIds',
  jsonb_build_array('abababab-0000-4000-8000-00000000a002'::uuid),
  'the host sees the mute they applied, so they can lift it'
);

-- Unmuting restores posting and leaves the mute in the audit trail.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a001', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a001","role":"authenticated"}', true);
select extensions.ok(
  public.set_study_room_mute(
    (select room_id from room_abuse_state),
    'abababab-0000-4000-8000-00000000a002', false, 'Apologised'),
  'a host can lift a mute'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.is(
  (select count(*) from public.study_room_moderation_actions where action = 'muted'),
  1::bigint,
  'the lifted mute is still recorded'
);

-- Removal ejects and blocks rejoining.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a001', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a001","role":"authenticated"}', true);
select extensions.ok(
  not public.remove_study_room_member(
    (select room_id from room_abuse_state),
    'abababab-0000-4000-8000-00000000a004', 'Ejecting the reviewer'),
  'a host cannot remove platform staff'
);
select extensions.ok(
  public.remove_study_room_member(
    (select room_id from room_abuse_state),
    'abababab-0000-4000-8000-00000000a002', 'Repeated abuse after a mute'),
  'a host can remove a participant'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.is(
  (select count(*) from public.study_room_members
   where room_id = (select room_id from room_abuse_state)
     and user_id = 'abababab-0000-4000-8000-00000000a002'),
  0::bigint,
  'the removed participant is no longer a member'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a002', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a002","role":"authenticated"}', true);
select extensions.throws_ok(
  $$select public.join_study_room((select room_id from room_abuse_state))$$,
  '42501',
  'Study room access is unavailable',
  'a removed participant cannot rejoin, and is told only that access is unavailable'
);

-- A co-host may act, but not against the host.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a001', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a001","role":"authenticated"}', true);
select public.set_study_room_member_role(
  (select room_id from room_abuse_state),
  'abababab-0000-4000-8000-00000000a003', 'cohost'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'abababab-0000-4000-8000-00000000a003', true);
select set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-00000000a003","role":"authenticated"}', true);
select extensions.ok(
  public.can_control_study_room((select room_id from room_abuse_state)),
  'a co-host can use room controls'
);
select extensions.ok(
  not public.remove_study_room_member(
    (select room_id from room_abuse_state),
    'abababab-0000-4000-8000-00000000a001', 'Taking over the room'),
  'a co-host cannot remove the host'
);

-- Restrictions belong to one room and die with it.
set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.is(
  (select count(*) from public.study_room_restrictions),
  1::bigint,
  'only the removal restriction remains after the mute was lifted'
);
delete from public.study_rooms where id = (select room_id from room_abuse_state);
select extensions.is(
  (select count(*) from public.study_room_restrictions),
  0::bigint,
  'restrictions are deleted with the room they belong to'
);
select extensions.is(
  (select count(*) from public.study_room_reports),
  1::bigint,
  'reports outlive the room, which is the point of the snapshot'
);

select * from extensions.finish();
rollback;
