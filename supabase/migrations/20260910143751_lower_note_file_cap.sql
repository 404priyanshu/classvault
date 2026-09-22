-- Lower the per-note upload cap from 25 MiB to 10 MiB.
--
-- The cap is enforced in four places that have to agree, or a file passes one
-- gate and is rejected by the next: the storage bucket, the byte_size check on
-- note_assets, the guard inside create_note_upload_draft, and the TypeScript
-- constant the browser validates against.
--
-- 25 MiB was chosen before the free tier's 1 GB of storage mattered. A single
-- 25 MiB note is 2.5% of total capacity and a worse deal on egress, which each
-- view spends again. Scanned unit notes sit well under 10 MiB, so the lower
-- cap costs real uploads nothing and roughly doubles how many notes fit.

update storage.buckets
   set file_size_limit = 10485760
 where id = 'note-files';

alter table public.note_assets
  drop constraint if exists note_assets_byte_size;

alter table public.note_assets
  add constraint note_assets_byte_size
  check (byte_size between 1 and 10485760);

create or replace function public.create_note_upload_draft(
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

  if p_byte_size not between 1 and 10485760 then
    raise exception 'Note file must be at most 10 MiB'
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
