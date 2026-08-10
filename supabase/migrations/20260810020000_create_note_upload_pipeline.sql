insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'note-files',
  'note-files',
  false,
  26214400,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function public.can_upload_note_object(target_object_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.note_assets as asset
    join public.notes as note on note.id = asset.note_id
    where asset.object_key = target_object_key
      and asset.storage_backend = 'supabase_storage'
      and asset.processing_status = 'uploading'
      and note.owner_id = (select auth.uid())
      and note.publication_status = 'draft'
      and note.deleted_at is null
  );
$$;

revoke all on function public.can_upload_note_object(text) from public;
grant execute on function public.can_upload_note_object(text) to authenticated;

create policy "note_files_insert_owned_upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'note-files'
    and (select public.can_upload_note_object(name))
  );

create policy "note_files_select_owned_upload"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'note-files'
    and (select public.can_upload_note_object(name))
  );

create policy "note_files_delete_owned_upload"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'note-files'
    and (select public.can_upload_note_object(name))
  );

create function public.create_note_upload_draft(
  p_title text,
  p_description text,
  p_subject_id bigint,
  p_note_type text,
  p_tags text[],
  p_visibility text,
  p_original_filename text,
  p_detected_mime_type text,
  p_byte_size bigint,
  p_sha256 text
)
returns table (
  note_id uuid,
  asset_id uuid,
  object_key text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  created_asset_id uuid := gen_random_uuid();
  created_note_id uuid := gen_random_uuid();
  selected_university_id bigint;
  selected_subject_university_id bigint;
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if not public.is_notes_eligible() then
    raise exception 'Complete onboarding before adding notes'
      using errcode = '42501';
  end if;

  if p_visibility not in ('public', 'university') then
    raise exception 'Invalid note visibility'
      using errcode = '22023';
  end if;

  if p_visibility = 'university' then
    select membership.university_id
    into selected_university_id
    from public.university_memberships as membership
    where membership.user_id = actor_id
      and membership.status = 'verified'
    order by membership.joined_at desc
    limit 1;

    if selected_university_id is null then
      raise exception 'Verified university membership is required'
        using errcode = '42501';
    end if;
  end if;

  select subject.university_id
  into selected_subject_university_id
  from public.subjects as subject
  where subject.id = p_subject_id
    and subject.is_active;

  if not found then
    raise exception 'Subject is unavailable'
      using errcode = '23503';
  end if;

  if selected_subject_university_id is not null
    and selected_subject_university_id is distinct from selected_university_id then
    raise exception 'Subject does not match note access scope'
      using errcode = '23514';
  end if;

  if p_detected_mime_type not in (
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ) then
    raise exception 'Unsupported note file type'
      using errcode = '22023';
  end if;

  if p_byte_size not between 1 and 26214400 then
    raise exception 'Note file must be at most 25 MiB'
      using errcode = '22023';
  end if;

  if p_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid file checksum'
      using errcode = '22023';
  end if;

  insert into public.notes (
    id,
    owner_id,
    subject_id,
    visibility,
    university_id,
    title,
    description,
    note_type,
    tags,
    publication_status
  )
  values (
    created_note_id,
    actor_id,
    p_subject_id,
    p_visibility,
    selected_university_id,
    trim(p_title),
    nullif(trim(p_description), ''),
    p_note_type,
    p_tags,
    'draft'
  );

  insert into public.note_assets (
    id,
    note_id,
    storage_backend,
    object_key,
    original_filename,
    detected_mime_type,
    byte_size,
    sha256,
    processing_status
  )
  values (
    created_asset_id,
    created_note_id,
    'supabase_storage',
    format('notes/%s/source/%s', created_note_id, created_asset_id),
    trim(p_original_filename),
    p_detected_mime_type,
    p_byte_size,
    p_sha256,
    'uploading'
  );

  return query
  select
    created_note_id,
    created_asset_id,
    format('notes/%s/source/%s', created_note_id, created_asset_id);
end;
$$;

create function public.complete_note_upload(
  p_note_id uuid,
  p_publish boolean,
  p_verified_mime_type text,
  p_verified_byte_size bigint,
  p_verified_sha256 text
)
returns table (
  note_id uuid,
  publication_status text,
  published_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  asset_record public.note_assets%rowtype;
  note_record public.notes%rowtype;
  stored_mime_type text;
  stored_byte_size bigint;
  stored_owner_id text;
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  select note.*
  into note_record
  from public.notes as note
  where note.id = p_note_id
  for update;

  if not found or note_record.owner_id <> actor_id then
    raise exception 'Note upload is unavailable'
      using errcode = '42501';
  end if;

  if note_record.publication_status <> 'draft'
    or note_record.deleted_at is not null then
    raise exception 'Note upload cannot be completed in its current state'
      using errcode = '23514';
  end if;

  select asset.*
  into asset_record
  from public.note_assets as asset
  where asset.note_id = note_record.id
  for update;

  if not found or asset_record.processing_status <> 'uploading' then
    raise exception 'Note file is unavailable for completion'
      using errcode = '23514';
  end if;

  if p_publish is null
    or p_verified_mime_type is null
    or p_verified_byte_size is null
    or p_verified_sha256 is null then
    raise exception 'Verified file metadata is required'
      using errcode = '22023';
  end if;

  select
    lower(coalesce(object.metadata ->> 'mimetype', '')),
    coalesce((object.metadata ->> 'size')::bigint, 0),
    object.owner_id
  into stored_mime_type, stored_byte_size, stored_owner_id
  from storage.objects as object
  where object.bucket_id = 'note-files'
    and object.name = asset_record.object_key;

  if not found then
    raise exception 'Uploaded note file was not found'
      using errcode = '23503';
  end if;

  if stored_owner_id is distinct from actor_id::text
    or stored_mime_type <> asset_record.detected_mime_type
    or stored_byte_size <> asset_record.byte_size
    or p_verified_mime_type <> asset_record.detected_mime_type
    or p_verified_byte_size <> asset_record.byte_size
    or p_verified_sha256 <> asset_record.sha256 then
    raise exception 'Uploaded note file did not match the upload intent'
      using errcode = '23514';
  end if;

  update public.note_assets as asset
  set processing_status = 'ready'
  where asset.id = asset_record.id;

  if p_publish then
    if note_record.visibility = 'university'
      and not public.has_verified_university_membership(note_record.university_id) then
      raise exception 'Verified university membership is required for publication'
        using errcode = '42501';
    end if;

    update public.notes as note
    set
      publication_status = 'published',
      published_at = now()
    where note.id = note_record.id
    returning note.* into note_record;

    insert into public.note_search_documents (note_id)
    values (note_record.id)
    on conflict (note_id) do nothing;
  end if;

  return query
  select
    note_record.id,
    note_record.publication_status,
    note_record.published_at;
end;
$$;

create function public.discard_note_upload_draft(p_note_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  upload_object_key text;
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  select asset.object_key
  into upload_object_key
  from public.notes as note
  join public.note_assets as asset on asset.note_id = note.id
  where note.id = p_note_id
    and note.owner_id = actor_id
    and note.publication_status = 'draft'
    and note.deleted_at is null
    and asset.processing_status = 'uploading'
  for update of note, asset;

  if not found then
    return false;
  end if;

  if exists (
    select 1
    from storage.objects as object
    where object.bucket_id = 'note-files'
      and object.name = upload_object_key
  ) then
    raise exception 'Remove the stored file before discarding its upload intent'
      using errcode = '23514';
  end if;

  delete from public.notes as note
  where note.id = p_note_id;

  return found;
end;
$$;

revoke all on function public.create_note_upload_draft(
  text,
  text,
  bigint,
  text,
  text[],
  text,
  text,
  text,
  bigint,
  text
) from public;
revoke all on function public.complete_note_upload(
  uuid,
  boolean,
  text,
  bigint,
  text
) from public;
revoke all on function public.discard_note_upload_draft(uuid) from public;

grant execute on function public.create_note_upload_draft(
  text,
  text,
  bigint,
  text,
  text[],
  text,
  text,
  text,
  bigint,
  text
) to authenticated;
grant execute on function public.complete_note_upload(
  uuid,
  boolean,
  text,
  bigint,
  text
) to authenticated;
grant execute on function public.discard_note_upload_draft(uuid) to authenticated;

comment on function public.create_note_upload_draft(
  text,
  text,
  bigint,
  text,
  text[],
  text,
  text,
  text,
  bigint,
  text
) is
  'Creates an owner-derived note draft and opaque private upload intent.';

comment on function public.complete_note_upload(
  uuid,
  boolean,
  text,
  bigint,
  text
) is
  'Confirms private object metadata and atomically saves or publishes an owned note.';

comment on function public.discard_note_upload_draft(uuid) is
  'Deletes an owned incomplete upload intent only after its storage object is absent.';
