-- Transactional pgTAP coverage for study-room rate limits. See ADR 0030.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(10);

create temp table rate_limit_state (
  singleton boolean primary key default true,
  room_id uuid,
  second_room_id uuid
);
grant all on rate_limit_state to authenticated, anon;

-- Tightened for the test rather than waited out: the caps are columns for
-- exactly this reason, and a suite that posts twelve messages to prove a cap of
-- twelve is testing patience, not the limit.
update public.study_room_plan_limits
set chat_messages_per_window = 2,
    rooms_per_window = 2
where plan = 'free';
update public.study_room_plan_limits
set chat_messages_per_window = 4
where plan = 'pro';

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000', 'efefefef-0000-4000-8000-00000000c001',
  'authenticated', 'authenticated', 'chatty@example.com', '', now(), '{}', '{}', now(), now()
);

update public.profiles
set onboarding_completed_at = now(), display_name = 'Chatty Student'
where id = 'efefefef-0000-4000-8000-00000000c001';

select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_room_plan_limits', 'SELECT'),
  'students cannot read the limits that govern them'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_room_creation_log', 'SELECT'),
  'students cannot read the room-creation ledger'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'efefefef-0000-4000-8000-00000000c001', true);
select set_config('request.jwt.claims', '{"sub":"efefefef-0000-4000-8000-00000000c001","role":"authenticated"}', true);

insert into rate_limit_state (room_id)
select public.create_study_room(
  'Rate limit room', 'Databases', 'public', 25::smallint, 5::smallint
);

-- Chat: the cap is per participant, per room, over a rolling window.
select public.send_study_room_message((select room_id from rate_limit_state), 'one');
select public.send_study_room_message((select room_id from rate_limit_state), 'two');
select extensions.throws_ok(
  $$select public.send_study_room_message(
      (select room_id from rate_limit_state), 'three')$$,
  '53400',
  'You are sending messages too quickly',
  'a participant cannot post past the chat cap'
);

-- Rolling, not absolute: once the window has moved on, posting resumes.
set local role postgres;
update public.study_room_messages
set created_at = now() - interval '1 hour'
where room_id = (select room_id from rate_limit_state);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'efefefef-0000-4000-8000-00000000c001', true);
select set_config('request.jwt.claims', '{"sub":"efefefef-0000-4000-8000-00000000c001","role":"authenticated"}', true);
select extensions.lives_ok(
  $$select public.send_study_room_message(
      (select room_id from rate_limit_state), 'four')$$,
  'the window rolls, so an old burst does not silence anyone permanently'
);

-- The room's own plan governs the room, not the poster's.
set local role postgres;
update public.study_room_messages
set created_at = now() - interval '1 hour'
where room_id = (select room_id from rate_limit_state);
update public.study_rooms
set host_plan_snapshot = 'pro'
where id = (select room_id from rate_limit_state);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'efefefef-0000-4000-8000-00000000c001', true);
select set_config('request.jwt.claims', '{"sub":"efefefef-0000-4000-8000-00000000c001","role":"authenticated"}', true);
select public.send_study_room_message((select room_id from rate_limit_state), 'pro one');
select public.send_study_room_message((select room_id from rate_limit_state), 'pro two');
select extensions.lives_ok(
  $$select public.send_study_room_message(
      (select room_id from rate_limit_state), 'pro three')$$,
  'a room on a higher plan allows more, though the poster resolves to free'
);

-- Room creation: the second is allowed, the third is not.
update rate_limit_state
set second_room_id = public.create_study_room(
  'Second room', 'Databases', 'public', 25::smallint, 5::smallint
);
select extensions.throws_ok(
  $$select public.create_study_room(
      'Third room', 'Databases', 'public', 25::smallint, 5::smallint)$$,
  '53400',
  'Too many rooms created recently',
  'a student cannot create past the room cap'
);

-- The reason the ledger exists: ending a room must not hand back a slot.
set local role postgres;
delete from public.study_rooms
where id in (
  (select room_id from rate_limit_state),
  (select second_room_id from rate_limit_state)
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'efefefef-0000-4000-8000-00000000c001', true);
select set_config('request.jwt.claims', '{"sub":"efefefef-0000-4000-8000-00000000c001","role":"authenticated"}', true);
select extensions.throws_ok(
  $$select public.create_study_room(
      'Room after cleanup', 'Databases', 'public', 25::smallint, 5::smallint)$$,
  '53400',
  'Too many rooms created recently',
  'ending the rooms does not hand the slots back'
);

-- The ledger keeps only what the widest window needs.
set local role postgres;
insert into public.study_room_creation_log (user_id, created_at)
values ('efefefef-0000-4000-8000-00000000c001', now() - interval '10 days');
delete from public.study_room_creation_log
where created_at > now() - interval '1 day';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'efefefef-0000-4000-8000-00000000c001', true);
select set_config('request.jwt.claims', '{"sub":"efefefef-0000-4000-8000-00000000c001","role":"authenticated"}', true);
select extensions.lives_ok(
  $$select public.create_study_room(
      'Room once the window passed', 'Databases', 'public', 25::smallint, 5::smallint)$$,
  'a student whose recent creations aged out can create again'
);

set local role postgres;
select extensions.is(
  (select count(*) from public.study_room_creation_log
   where created_at < now() - interval '1 day'),
  0::bigint,
  'the ancient ledger row was pruned by the creation that followed it'
);
select extensions.is(
  (select count(*) from public.study_room_creation_log),
  1::bigint,
  'and the ledger keeps only the creation still inside the window'
);

select * from extensions.finish();
rollback;
