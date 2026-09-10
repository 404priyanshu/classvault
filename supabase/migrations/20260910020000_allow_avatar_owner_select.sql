-- Let a student read their own avatar object, so replacing it can work.

-- The avatar upload uses `upsert: true`, which reaches Postgres as
-- `insert into storage.objects ... on conflict (bucket_id, name) do update`.
-- That form has to be able to read the conflicting row, so it requires a
-- select policy in addition to the insert and update ones — and the avatar
-- bucket shipped without any select policy at all. Every upload was rejected
-- with "new row violates row-level security policy for table objects", even
-- the first one, where nothing was in conflict.
--
-- The bucket is public, so the object bytes were already world-readable
-- through their public URL. This grants no new visibility; it only lets the
-- owner see the row for the object they are allowed to write.

create policy "profile_avatars_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

comment on policy "profile_avatars_select_own" on storage.objects is
  'Authenticated students may read only their exact stable avatar object.';
