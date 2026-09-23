-- Let a public note use a subject its uploader's campus created.
--
-- find_or_create_subject (20260830000000) creates a subject the catalog lacks
-- against the caller's university, so one campus's course names never land in
-- another campus's suggestions. But both create_note_upload_draft and the
-- notes subject-scope trigger allowed a campus subject only on a campus-only
-- note, and public is the upload form's default. So a student who typed a new
-- course name and kept "Public" was refused with "Choose an available subject
-- for this note", and only the nine seeded global subjects worked for public
-- notes.
--
-- A public note may now use a subject from its owner's own campus. Nothing
-- about who can read it changes: the subjects policy already exposes a
-- subject to anyone who can see a note filed under it, so students elsewhere
-- see the course name on the public note without it entering their catalog.
-- A campus-only note still needs a subject from its own campus.

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

  -- A campus subject may carry a public note from its own campus: that is the
  -- row find_or_create_subject makes when a student names a course the
  -- catalog lacks. A campus note still needs a subject from its own campus.
  if selected_subject_university_id is not null
    and selected_subject_university_id is distinct from coalesce(
      selected_university_id,
      (
        select membership.university_id
        from public.university_memberships as membership
        where membership.user_id = actor_id
      )
    ) then
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

create or replace function public.validate_note_subject_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subject_university_id bigint;
  subject_is_active boolean;
  owner_university_id bigint;
begin
  if new.subject_id is null then
    return new;
  end if;

  select subject.university_id, subject.is_active
  into subject_university_id, subject_is_active
  from public.subjects as subject
  where subject.id = new.subject_id;

  if not found then
    raise exception 'Subject is unavailable'
      using errcode = '23503';
  end if;

  if new.publication_status = 'published' and not subject_is_active then
    raise exception 'Inactive subjects cannot be used for publication'
      using errcode = '23514';
  end if;

  if subject_university_id is null then
    return new;
  end if;

  if new.visibility = 'university' then
    if new.university_id is distinct from subject_university_id then
      raise exception 'University subject does not match note scope'
        using errcode = '23514';
    end if;
    return new;
  end if;

  -- A public note on a campus subject: the subject must come from the owner's
  -- campus. Checked when the pairing is made, not on every later publication
  -- or moderation change, so a student who moves campus does not strand the
  -- public notes they already filed.
  if tg_op = 'INSERT'
    or new.subject_id is distinct from old.subject_id
    or new.visibility is distinct from old.visibility then
    select membership.university_id
    into owner_university_id
    from public.university_memberships as membership
    where membership.user_id = new.owner_id;

    if owner_university_id is distinct from subject_university_id then
      raise exception 'University subject does not match note scope'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;
