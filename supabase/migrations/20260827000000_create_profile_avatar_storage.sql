-- Public profile avatars with exact owner-folder write authorization.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

create policy "profile_avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  )
  with check (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

create policy "profile_avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

-- Skipped on a local stack: COMMENT ON POLICY needs ownership of
-- storage.objects, which only hosted Supabase's migration role has (42501).
do $$
begin
  execute $c$comment on policy "profile_avatars_insert_own" on storage.objects is 'Authenticated students may create only their exact stable avatar object.'$c$;
  execute $c$comment on policy "profile_avatars_update_own" on storage.objects is 'Authenticated students may replace only their exact stable avatar object.'$c$;
  execute $c$comment on policy "profile_avatars_delete_own" on storage.objects is 'Authenticated students may remove only their exact stable avatar object.'$c$;
exception when insufficient_privilege then
  raise notice 'skipped comments on profile_avatars policies: %', sqlerrm;
end
$$;
