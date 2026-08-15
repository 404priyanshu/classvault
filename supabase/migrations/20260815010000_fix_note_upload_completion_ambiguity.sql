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
    on conflict on constraint note_search_documents_pkey do nothing;
  end if;

  return query
  select
    note_record.id,
    note_record.publication_status,
    note_record.published_at;
end;
$$;

revoke all on function public.complete_note_upload(
  uuid,
  boolean,
  text,
  bigint,
  text
) from public, anon, authenticated;

grant execute on function public.complete_note_upload(
  uuid,
  boolean,
  text,
  bigint,
  text
) to authenticated;

comment on function public.complete_note_upload(
  uuid,
  boolean,
  text,
  bigint,
  text
) is
  'Idempotently verifies and completes an owned note upload.';
