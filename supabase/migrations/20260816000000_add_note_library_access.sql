create function public.get_accessible_note_contributors(p_note_ids uuid[])
returns table (
  note_id uuid,
  owner_id uuid,
  display_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    note.id,
    profile.id,
    coalesce(nullif(trim(profile.display_name), ''), 'ClassVault student'),
    profile.avatar_url
  from public.notes as note
  join public.profiles as profile on profile.id = note.owner_id
  where note.id = any(coalesce(p_note_ids, '{}'::uuid[]))
    and public.can_consume_note(note.id);
$$;

create function public.get_accessible_note_file(p_note_id uuid)
returns table (
  note_id uuid,
  object_key text,
  original_filename text,
  detected_mime_type text,
  byte_size bigint,
  page_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    note.id,
    asset.object_key,
    asset.original_filename,
    asset.detected_mime_type,
    asset.byte_size,
    asset.page_count
  from public.notes as note
  join public.note_assets as asset on asset.note_id = note.id
  where note.id = p_note_id
    and asset.storage_backend = 'supabase_storage'
    and asset.processing_status = 'ready'
    and public.can_consume_note(note.id);
$$;

create function public.can_download_note_object(target_object_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.note_assets as asset
    where asset.object_key = target_object_key
      and asset.storage_backend = 'supabase_storage'
      and asset.processing_status = 'ready'
      and public.can_consume_note(asset.note_id)
  );
$$;

revoke all on function public.get_accessible_note_contributors(uuid[])
  from public, anon, authenticated;
revoke all on function public.get_accessible_note_file(uuid)
  from public, anon, authenticated;
revoke all on function public.can_download_note_object(text)
  from public, anon, authenticated;

grant execute on function public.get_accessible_note_contributors(uuid[])
  to authenticated;
grant execute on function public.get_accessible_note_file(uuid)
  to authenticated;
grant execute on function public.can_download_note_object(text)
  to authenticated;

drop policy if exists "note_files_select_accessible_download" on storage.objects;
create policy "note_files_select_accessible_download"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'note-files'
    and (select public.can_download_note_object(name))
  );

comment on function public.get_accessible_note_contributors(uuid[]) is
  'Returns only pseudonymous profile fields for currently consumable notes.';

comment on function public.get_accessible_note_file(uuid) is
  'Returns private source-file metadata only after current note consumption authorization succeeds.';

comment on function public.can_download_note_object(text) is
  'Authorizes private Storage reads only for ready source objects attached to currently consumable notes.';

comment on policy "note_files_select_accessible_download" on storage.objects is
  'Allows authenticated students to read ready source objects only while they may consume the associated note.';
