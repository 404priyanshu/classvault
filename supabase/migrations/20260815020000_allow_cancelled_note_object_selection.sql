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

comment on policy "note_files_select_owned_upload" on storage.objects is
  'Allows an owner to address an exact uploading or cancelled note object.';
