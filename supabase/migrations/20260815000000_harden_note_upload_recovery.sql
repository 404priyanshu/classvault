create or replace function public.complete_note_upload(
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

  if p_publish is null
    or p_verified_mime_type is null
    or p_verified_byte_size is null
    or p_verified_sha256 is null then
    raise exception 'Verified file metadata is required'
      using errcode = '22023';
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

  if note_record.deleted_at is not null then
    raise exception 'Note upload cannot be completed in its current state'
      using errcode = '23514';
  end if;

  select asset.*
  into asset_record
  from public.note_assets as asset
  where asset.note_id = note_record.id
  for update;

  if not found then
    raise exception 'Note file is unavailable for completion'
      using errcode = '23514';
  end if;

  if asset_record.processing_status = 'ready'
    and note_record.publication_status in ('draft', 'published') then
    if note_record.publication_status
      <> (case when p_publish then 'published' else 'draft' end) then
      raise exception 'Note upload cannot be completed with a different publication intent'
        using errcode = '23514';
    end if;

    if p_verified_mime_type <> asset_record.detected_mime_type
      or p_verified_byte_size <> asset_record.byte_size
      or p_verified_sha256 <> asset_record.sha256 then
      raise exception 'Uploaded note file did not match the upload intent'
        using errcode = '23514';
    end if;

    return query
    select
      note_record.id,
      note_record.publication_status,
      note_record.published_at;
    return;
  end if;

  if note_record.publication_status <> 'draft'
    or asset_record.processing_status <> 'uploading' then
    raise exception 'Note upload cannot be completed in its current state'
      using errcode = '23514';
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

create or replace function public.get_note_upload_status(p_note_id uuid)
returns table (
  note_id uuid,
  publication_status text,
  processing_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    note.id,
    note.publication_status,
    asset.processing_status
  from public.notes as note
  join public.note_assets as asset on asset.note_id = note.id
  where note.id = p_note_id
    and note.owner_id = (select auth.uid())
    and note.deleted_at is null;
$$;

create or replace function public.begin_note_upload_discard(
  p_note_id uuid,
  p_object_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  asset_record public.note_assets%rowtype;
  note_record public.notes%rowtype;
begin
  if actor_id is null then
    return false;
  end if;

  select note.*
  into note_record
  from public.notes as note
  where note.id = p_note_id
  for update;

  if not found
    or note_record.owner_id <> actor_id
    or note_record.publication_status <> 'draft'
    or note_record.deleted_at is not null then
    return false;
  end if;

  select asset.*
  into asset_record
  from public.note_assets as asset
  where asset.note_id = note_record.id
  for update;

  if not found
    or asset_record.object_key <> p_object_key
    or asset_record.processing_status <> 'uploading' then
    return false;
  end if;

  update public.note_assets as asset
  set processing_status = 'rejected'
  where asset.id = asset_record.id;

  return true;
end;
$$;

create or replace function public.can_delete_cancelled_note_object(
  target_object_key text
)
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
      and asset.processing_status = 'rejected'
      and note.owner_id = (select auth.uid())
      and note.publication_status = 'draft'
      and note.deleted_at is null
  );
$$;

drop policy if exists "note_files_delete_owned_upload" on storage.objects;
create policy "note_files_delete_owned_upload"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'note-files'
    and (
      (select public.can_upload_note_object(name))
      or (select public.can_delete_cancelled_note_object(name))
    )
  );

create or replace function public.discard_note_upload_draft(p_note_id uuid)
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
    and asset.processing_status = 'rejected'
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

revoke all on function public.complete_note_upload(
  uuid,
  boolean,
  text,
  bigint,
  text
) from public, anon, authenticated;
revoke all on function public.get_note_upload_status(uuid)
  from public, anon, authenticated;
revoke all on function public.begin_note_upload_discard(uuid, text)
  from public, anon, authenticated;
revoke all on function public.can_delete_cancelled_note_object(text)
  from public, anon, authenticated;
revoke all on function public.discard_note_upload_draft(uuid)
  from public, anon, authenticated;

grant execute on function public.complete_note_upload(
  uuid,
  boolean,
  text,
  bigint,
  text
) to authenticated;
grant execute on function public.get_note_upload_status(uuid) to authenticated;
grant execute on function public.begin_note_upload_discard(uuid, text) to authenticated;
grant execute on function public.can_delete_cancelled_note_object(text) to authenticated;
grant execute on function public.discard_note_upload_draft(uuid) to authenticated;

comment on function public.complete_note_upload(
  uuid,
  boolean,
  text,
  bigint,
  text
) is
  'Idempotently verifies and completes an owned note upload.';
comment on function public.get_note_upload_status(uuid) is
  'Returns private completion state for an owned note upload.';
comment on function public.begin_note_upload_discard(uuid, text) is
  'Atomically claims an incomplete owned upload for safe cleanup.';
comment on function public.can_delete_cancelled_note_object(text) is
  'Authorizes deletion of an exact object after its upload was cancelled.';
comment on function public.discard_note_upload_draft(uuid) is
  'Deletes a cancelled owned upload intent after its storage object is absent.';
