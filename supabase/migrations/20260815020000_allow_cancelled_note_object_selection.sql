drop policy if exists "note_files_select_owned_upload" on storage.objects;
create policy "note_files_select_owned_upload"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'note-files'
    and (
      (select public.can_upload_note_object(name))
      or (select public.can_delete_cancelled_note_object(name))
    )
  );

-- storage.objects is owned by supabase_storage_admin. Hosted Supabase applies
-- migrations with rights over it; a local stack does not, and COMMENT ON POLICY
-- requires table ownership — so this raises 42501 there while CREATE POLICY
-- above succeeds. The comment is documentation, so skip it rather than fail the
-- migration and make the schema unreproducible outside the hosted project.
do $$
begin
  execute $c$comment on policy "note_files_select_owned_upload" on storage.objects is 'Allows an owner to address an exact uploading or cancelled note object.'$c$;
exception when insufficient_privilege then
  raise notice 'skipped comment on note_files_select_owned_upload: %', sqlerrm;
end
$$;
