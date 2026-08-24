-- Transactional pgTAP coverage for study-room access, lifecycle, timer,
-- membership continuity, ephemeral chat, and worker-only expiry cleanup.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(57);

select extensions.is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'study_room_plan_limits',
        'study_rooms',
        'study_room_members',
        'study_room_messages'
      )
  ),
  4,
  'all study-room foundation tables exist'
);
select extensions.is(
  (
    select count(*)::integer
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in (
        'study_room_plan_limits',
        'study_rooms',
        'study_room_members',
        'study_room_messages'
      )
      and relation.relrowsecurity
  ),
  4,
  'RLS is enabled on every study-room table'
);
select extensions.is(
  (
    select count(*)::integer
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in (
        'study_room_plan_limits',
        'study_rooms',
        'study_room_members',
        'study_room_messages'
      )
      and relation.relforcerowsecurity
  ),
  4,
  'RLS is forced on every study-room table'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.study_rooms', 'SELECT'),
  'anonymous users cannot list study rooms'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.study_rooms', 'SELECT'),
  'authenticated users receive RLS-filtered room reads'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.study_room_members', 'SELECT'),
  'authenticated room members can receive RLS-filtered member reads'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.study_room_messages', 'SELECT'),
  'authenticated room members can receive RLS-filtered chat reads'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_room_plan_limits', 'SELECT'),
  'plan limits remain server-owned configuration'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_rooms', 'INSERT'),
  'students cannot insert room rows directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_room_members', 'INSERT'),
  'students cannot insert membership rows directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.study_room_messages', 'INSERT'),
  'students cannot insert chat rows directly'
);
select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.create_study_room(text,text,text,smallint,smallint)',
    'EXECUTE'
  ),
  'authenticated students can call validated room creation'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.join_study_room(uuid)', 'EXECUTE'),
  'authenticated students can call validated room join'
);
select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.update_study_room_timer(uuid,text,bigint)',
    'EXECUTE'
  ),
  'authenticated room controllers can call timer mutation'
);
select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.send_study_room_message(uuid,text)',
    'EXECUTE'
  ),
  'authenticated room members can call chat mutation'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.purge_expired_study_rooms()',
    'EXECUTE'
  ),
  'students cannot purge expired rooms'
);
select extensions.ok(
  has_function_privilege(
    'service_role',
    'public.purge_expired_study_rooms()',
    'EXECUTE'
  ),
  'the server worker can purge expired rooms'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.current_study_room_plan()',
    'EXECUTE'
  ),
  'students cannot choose or inspect the server-owned entitlement resolver'
);

create temp table study_room_test_state (
  key text primary key,
  room_id uuid not null
);
grant select, insert, update on study_room_test_state to authenticated, service_role;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '51515151-5151-4151-8151-515151515101', 'authenticated', 'authenticated', 'room-host@bennett.edu.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '51515151-5151-4151-8151-515151515102', 'authenticated', 'authenticated', 'room-peer@bennett.edu.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '51515151-5151-4151-8151-515151515103', 'authenticated', 'authenticated', 'room-outsider@iitd.ac.in', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '51515151-5151-4151-8151-515151515104', 'authenticated', 'authenticated', 'room-pending@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '51515151-5151-4151-8151-515151515105', 'authenticated', 'authenticated', 'room-incomplete@example.com', '', now(), '{}', '{}', now(), now());

update public.profiles
set
  display_name = case id
    when '51515151-5151-4151-8151-515151515101' then 'Room Host'
    when '51515151-5151-4151-8151-515151515102' then 'Bennett Peer'
    when '51515151-5151-4151-8151-515151515103' then 'IIT Peer'
    when '51515151-5151-4151-8151-515151515104' then 'Pending Peer'
    else 'Incomplete Peer'
  end,
  onboarding_completed_at = case
    when id = '51515151-5151-4151-8151-515151515105' then null
    else now()
  end
where id in (
  '51515151-5151-4151-8151-515151515101',
  '51515151-5151-4151-8151-515151515102',
  '51515151-5151-4151-8151-515151515103',
  '51515151-5151-4151-8151-515151515104',
  '51515151-5151-4151-8151-515151515105'
);

insert into public.university_memberships (
  user_id, university_id, academic_email, status, role, verified_at
)
values
  ('51515151-5151-4151-8151-515151515101', (select id from public.universities where slug = 'bennett-university'), 'room-host@bennett.edu.in', 'verified', 'student', now()),
  ('51515151-5151-4151-8151-515151515102', (select id from public.universities where slug = 'bennett-university'), 'room-peer@bennett.edu.in', 'verified', 'student', now()),
  ('51515151-5151-4151-8151-515151515103', (select id from public.universities where slug = 'iit-delhi'), 'room-outsider@iitd.ac.in', 'verified', 'student', now()),
  ('51515151-5151-4151-8151-515151515104', (select id from public.universities where slug = 'bennett-university'), 'room-pending@example.com', 'pending', 'student', null);

set local role authenticated;
select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515101', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515101","role":"authenticated"}', true);

insert into study_room_test_state (key, room_id)
values (
  'public',
  public.create_study_room(
    'Operating Systems Sprint',
    'Operating Systems',
    'public',
    25::smallint,
    5::smallint
  )
);

select extensions.ok(
  exists (
    select 1
    from public.study_rooms as room
    where room.id = (select room_id from study_room_test_state where key = 'public')
      and room.visibility = 'public'
      and room.university_id is null
  ),
  'an eligible host can create a public room'
);
select extensions.ok(
  exists (
    select 1
    from public.study_rooms as room
    where room.id = (select room_id from study_room_test_state where key = 'public')
      and room.host_plan_snapshot = 'free'
      and room.member_capacity = 8
      and room.ends_at = room.created_at + interval '120 minutes'
  ),
  'creation snapshots configurable Free capacity and duration limits'
);
select extensions.ok(
  exists (
    select 1
    from public.study_rooms as room
    where room.id = (select room_id from study_room_test_state where key = 'public')
      and room.timer_phase = 'focus'
      and room.timer_status = 'paused'
      and room.timer_remaining_seconds = 1500
      and room.timer_revision = 0
  ),
  'new rooms start with a durable paused focus timer'
);
select extensions.ok(
  exists (
    select 1
    from public.study_room_members as member
    where member.room_id = (select room_id from study_room_test_state where key = 'public')
      and member.user_id = '51515151-5151-4151-8151-515151515101'
      and member.role = 'host'
      and member.display_name_snapshot = 'Room Host'
  ),
  'room creation atomically installs the creator as host with a safe label'
);

insert into study_room_test_state (key, room_id)
values (
  'campus',
  public.create_study_room(
    'Bennett DBMS Revision',
    'Database Management Systems',
    'university',
    30::smallint,
    10::smallint
  )
);

select extensions.ok(
  exists (
    select 1
    from public.study_rooms as room
    where room.id = (select room_id from study_room_test_state where key = 'campus')
      and room.visibility = 'university'
      and room.university_id = (select id from public.universities where slug = 'bennett-university')
  ),
  'verified hosts create university rooms only for their current university'
);

select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515105', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515105","role":"authenticated"}', true);
select extensions.throws_ok(
  $$
    select public.create_study_room(
      'Incomplete room', 'Algorithms', 'public', 25::smallint, 5::smallint
    )
  $$,
  '42501',
  null,
  'onboarding-incomplete users cannot create rooms'
);

select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515104', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515104","role":"authenticated"}', true);
select extensions.throws_ok(
  $$
    select public.create_study_room(
      'Pending campus room', 'Algorithms', 'university', 25::smallint, 5::smallint
    )
  $$,
  '42501',
  null,
  'pending university members cannot create campus rooms'
);

select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515103', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515103","role":"authenticated"}', true);
select extensions.is(
  (
    select count(*)
    from public.list_study_rooms()
    where room_id = (select room_id from study_room_test_state where key = 'campus')
  ),
  0::bigint,
  'cross-university students cannot discover a campus room'
);
select extensions.is(
  (
    select count(*)
    from public.list_study_rooms()
    where room_id = (select room_id from study_room_test_state where key = 'public')
  ),
  1::bigint,
  'eligible students can discover public rooms'
);
select extensions.throws_ok(
  $$
    select public.join_study_room(
      (select room_id from study_room_test_state where key = 'campus')
    )
  $$,
  '42501',
  null,
  'cross-university direct-ID joins are rejected'
);
select extensions.is(
  public.join_study_room(
    (select room_id from study_room_test_state where key = 'public')
  ),
  true,
  'eligible students can join a public room'
);
select extensions.ok(
  public.send_study_room_message(
    (select room_id from study_room_test_state where key = 'public'),
    'Ready for the first focus block.'
  ) > 0,
  'room members can persist a scoped chat message'
);
select extensions.throws_ok(
  $$
    select * from public.update_study_room_timer(
      (select room_id from study_room_test_state where key = 'public'),
      'start',
      0
    )
  $$,
  '42501',
  null,
  'ordinary members cannot mutate synchronized timer state'
);
select extensions.is(
  (
    select count(*)
    from public.study_room_members
    where room_id = (select room_id from study_room_test_state where key = 'campus')
  ),
  0::bigint,
  'non-members cannot read another university room membership'
);

select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515102', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515102","role":"authenticated"}', true);
select extensions.is(
  (
    select count(*)
    from public.list_study_rooms()
    where room_id = (select room_id from study_room_test_state where key = 'campus')
  ),
  1::bigint,
  'same-university verified students can discover a campus room'
);
select extensions.is(
  public.join_study_room(
    (select room_id from study_room_test_state where key = 'campus')
  ),
  true,
  'same-university verified students can join a campus room'
);

select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515101', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515101","role":"authenticated"}', true);
select extensions.is(
  public.set_study_room_member_role(
    (select room_id from study_room_test_state where key = 'campus'),
    '51515151-5151-4151-8151-515151515102',
    'cohost'
  ),
  true,
  'the current host can appoint a co-host'
);
select extensions.is(
  (
    select timer_revision
    from public.update_study_room_timer(
      (select room_id from study_room_test_state where key = 'campus'),
      'start',
      0
    )
  ),
  1::bigint,
  'host timer start advances the durable revision'
);
select extensions.throws_ok(
  $$
    select * from public.update_study_room_timer(
      (select room_id from study_room_test_state where key = 'campus'),
      'pause',
      0
    )
  $$,
  '40001',
  null,
  'stale timer revisions are rejected'
);
select extensions.is(
  (
    select timer_status
    from public.update_study_room_timer(
      (select room_id from study_room_test_state where key = 'campus'),
      'pause',
      1
    )
  ),
  'paused',
  'the host can pause the synchronized timer using the current revision'
);
select extensions.ok(
  public.send_study_room_message(
    (select room_id from study_room_test_state where key = 'campus'),
    'We will review normalization after this block.'
  ) > 0,
  'the host can add ephemeral campus-room chat'
);
select extensions.is(
  (
    select member_count
    from public.list_study_rooms()
    where room_id = (select room_id from study_room_test_state where key = 'campus')
  ),
  2::bigint,
  'room listings derive the exact joined-member count'
);
select extensions.throws_ok(
  $$
    update public.study_rooms
    set member_capacity = 99
    where id = (select room_id from study_room_test_state where key = 'campus')
  $$,
  '42501',
  null,
  'hosts cannot bypass server-owned room mutations with direct updates'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
update public.university_memberships
set status = 'pending', verified_at = null
where user_id = '51515151-5151-4151-8151-515151515101';

set local role authenticated;
select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515101', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515101","role":"authenticated"}', true);
select extensions.is(
  public.get_study_room_snapshot(
    (select room_id from study_room_test_state where key = 'campus')
  ),
  null::jsonb,
  'revoked campus hosts cannot read the protected room snapshot'
);
select extensions.is(
  (
    select count(*)
    from public.study_room_members
    where room_id = (select room_id from study_room_test_state where key = 'campus')
  ),
  0::bigint,
  'revoked campus members lose RLS access to room identities'
);
select extensions.throws_ok(
  $$
    select public.send_study_room_message(
      (select room_id from study_room_test_state where key = 'campus'),
      'This message must be rejected.'
    )
  $$,
  '42501',
  null,
  'revoked campus hosts cannot retain chat access'
);
select extensions.throws_ok(
  $$
    select * from public.update_study_room_timer(
      (select room_id from study_room_test_state where key = 'campus'),
      'start',
      2
    )
  $$,
  '42501',
  null,
  'revoked campus hosts cannot retain timer controls'
);
select extensions.throws_ok(
  $$
    select public.end_study_room(
      (select room_id from study_room_test_state where key = 'campus')
    )
  $$,
  '42501',
  null,
  'revoked campus hosts cannot end the room for remaining members'
);
select extensions.is(
  (
    select new_host_id
    from public.leave_study_room(
      (select room_id from study_room_test_state where key = 'campus')
    )
  ),
  '51515151-5151-4151-8151-515151515102'::uuid,
  'leaving hosts transfer control to the earliest co-host'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.ok(
  exists (
    select 1
    from public.study_room_members as member
    where member.room_id = (select room_id from study_room_test_state where key = 'campus')
      and member.user_id = '51515151-5151-4151-8151-515151515102'
      and member.role = 'host'
  ),
  'the promoted co-host becomes the room''s unique host'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515102', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515102","role":"authenticated"}', true);
select extensions.is(
  public.end_study_room(
    (select room_id from study_room_test_state where key = 'campus')
  ),
  true,
  'the promoted host can end the room'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.is(
  (
    select count(*)
    from public.study_room_messages
    where room_id = (select room_id from study_room_test_state where key = 'campus')
  ),
  0::bigint,
  'ending a room cascades its ephemeral chat history'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515101', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515101","role":"authenticated"}', true);
insert into study_room_test_state (key, room_id)
values (
  'hostless',
  public.create_study_room(
    'Host continuity check', 'Computer Networks', 'public', 20::smallint, 5::smallint
  )
);

select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515104', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515104","role":"authenticated"}', true);
select public.join_study_room(
  (select room_id from study_room_test_state where key = 'hostless')
);

select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515101', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515101","role":"authenticated"}', true);
select extensions.is(
  (
    select room_deleted
    from public.leave_study_room(
      (select room_id from study_room_test_state where key = 'hostless')
    )
  ),
  false,
  'a room remains alive when its host leaves without a co-host'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.is(
  (
    select count(*)
    from public.study_room_members as member
    where member.room_id = (select room_id from study_room_test_state where key = 'hostless')
      and member.role = 'host'
  ),
  0::bigint,
  'a room without a co-host continues without active host controls'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515104', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515104","role":"authenticated"}', true);
select extensions.is(
  (
    select room_deleted
    from public.leave_study_room(
      (select room_id from study_room_test_state where key = 'hostless')
    )
  ),
  true,
  'the last participant leaving deletes the temporary room'
);

select set_config('request.jwt.claim.sub', '51515151-5151-4151-8151-515151515101', true);
select set_config('request.jwt.claims', '{"sub":"51515151-5151-4151-8151-515151515101","role":"authenticated"}', true);
insert into study_room_test_state (key, room_id)
values (
  'expired',
  public.create_study_room(
    'Expiry cleanup check', 'Discrete Mathematics', 'public', 25::smallint, 5::smallint
  )
);
select public.send_study_room_message(
  (select room_id from study_room_test_state where key = 'expired'),
  'This message disappears with the room.'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
update public.study_rooms as room
set
  created_at = now() - interval '121 minutes',
  ends_at = now() - interval '1 minute'
where room.id = (select room_id from study_room_test_state where key = 'expired');

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.ok(
  public.purge_expired_study_rooms() >= 1,
  'the service worker purges expired study rooms'
);

set local role postgres;
select set_config('request.jwt.claims', '{"role":"postgres"}', true);
select extensions.ok(
  not exists (
    select 1
    from public.study_rooms as room
    where room.id = (select room_id from study_room_test_state where key = 'expired')
  ),
  'expiry cleanup removes the room row'
);
select extensions.ok(
  not exists (
    select 1
    from public.study_room_messages as message
    where message.room_id = (select room_id from study_room_test_state where key = 'expired')
  ),
  'expiry cleanup cascades chat rows'
);
select extensions.is(
  (
    select count(*)::integer
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename in (
        'study_rooms',
        'study_room_members',
        'study_room_messages'
      )
  ),
  3,
  'rooms, members, and messages are published for Supabase Realtime'
);

select * from extensions.finish();
rollback;
