-- Transactional pgTAP coverage for profile-avatar bucket configuration and
-- exact owner-object Storage RLS.
begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(13);

select extensions.ok(
  exists (select 1 from storage.buckets where id = 'profile-avatars'),
  'the profile avatar bucket exists'
);
select extensions.is(
  (select public from storage.buckets where id = 'profile-avatars'),
  true,
  'profile avatars are publicly renderable'
);
select extensions.is(
  (select file_size_limit from storage.buckets where id = 'profile-avatars'),
  2097152::bigint,
  'profile avatar objects are limited to 2 MiB'
);
select extensions.is(
  (select allowed_mime_types from storage.buckets where id = 'profile-avatars'),
  array['image/jpeg', 'image/png', 'image/webp']::text[],
  'the bucket accepts only supported raster image MIME types'
);
select extensions.is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'profile_avatars_insert_own',
        'profile_avatars_update_own',
        'profile_avatars_delete_own'
      )
  ),
  3,
  'exact owner insert, update, and delete policies are installed'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', 'authenticated', 'authenticated', 'avatar-owner@example.com', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2', 'authenticated', 'authenticated', 'avatar-other@example.com', '', now(), '{}', '{}', now(), now());

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select extensions.throws_ok(
  $$
    insert into storage.objects (bucket_id, name, metadata)
    values ('profile-avatars', 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1/avatar', '{}'::jsonb)
  $$,
  '42501',
  null,
  'anonymous users cannot create avatar objects'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', true);
select set_config('request.jwt.claims', '{"sub":"a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1","role":"authenticated"}', true);

select extensions.lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'profile-avatars',
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1/avatar',
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
      '{"mimetype":"image/webp"}'::jsonb
    )
  $$,
  'an authenticated student can create their exact avatar object'
);
select extensions.throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'profile-avatars',
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1/extra',
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
      '{}'::jsonb
    )
  $$,
  '42501',
  null,
  'an owner cannot create extra objects in their folder'
);
select extensions.throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'profile-avatars',
      'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2/avatar',
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
      '{}'::jsonb
    )
  $$,
  '42501',
  null,
  'an owner cannot create another student avatar'
);
select extensions.lives_ok(
  $$
    update storage.objects
    set metadata = '{"mimetype":"image/png"}'::jsonb
    where bucket_id = 'profile-avatars'
      and name = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1/avatar'
  $$,
  'an owner can replace their avatar metadata'
);

select set_config('request.jwt.claim.sub', 'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2', true);
select set_config('request.jwt.claims', '{"sub":"b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2","role":"authenticated"}', true);

select extensions.ok(
  not exists (
    select 1 from storage.objects
    where bucket_id = 'profile-avatars'
      and name = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1/avatar'
  ),
  'another student cannot list the owner avatar through the Storage table'
);

select extensions.ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_avatars_delete_own'
      and cmd = 'DELETE'
      and roles = array['authenticated']::name[]
  ),
  'the avatar delete policy is scoped to authenticated deletes'
);
select extensions.ok(
  (
    select qual ilike '%profile-avatars%'
      and qual ilike '%auth.uid%'
      and qual ilike '%/avatar%'
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_avatars_delete_own'
  ),
  'the delete policy requires the exact authenticated owner avatar path'
);

select * from extensions.finish();
rollback;
