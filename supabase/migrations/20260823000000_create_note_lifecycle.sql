-- Owner-controlled note lifecycle: soft deletion, restoration, and purge.
-- All client mutations stay behind narrowly scoped functions; direct table
-- writes remain revoked.

set search_path = '';

alter table public.notes
  add column if not exists purge_claimed_at timestamptz;

create index if not exists notes_owner_lifecycle_idx
  on public.notes (owner_id, deleted_at, created_at desc, id);

create index if not exists notes_purge_candidates_idx
  on public.notes (purge_after, id)
  where deleted_at is not null
    and retention_hold = false;

create function public.list_owned_notes(p_include_deleted boolean default false)
returns table (
  note_id uuid,
  title text,
  description text,
  note_type text,
  visibility text,
  publication_status text,
  moderation_status text,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  purge_after timestamptz,
  retention_hold boolean,
  subject_code text,
  subject_name text,
  original_filename text,
  detected_mime_type text,
  byte_size bigint,
  processing_status text,
  rating_count bigint,
  average_rating numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    note.id,
    note.title,
    note.description,
    note.note_type,
    note.visibility,
    note.publication_status,
    note.moderation_status,
    note.published_at,
    note.created_at,
    note.updated_at,
    note.deleted_at,
    note.purge_after,
    note.retention_hold,
    subject.code,
    subject.name,
    asset.original_filename,
    asset.detected_mime_type,
    asset.byte_size,
    asset.processing_status,
    coalesce(summary.rating_count, 0),
    summary.average_rating
  from public.notes as note
  left join public.subjects as subject on subject.id = note.subject_id
  left join public.note_assets as asset on asset.note_id = note.id
  left join public.note_rating_summaries as summary on summary.note_id = note.id
  where note.owner_id = (select auth.uid())
    and (
      (coalesce(p_include_deleted, false) and note.deleted_at is not null)
      or (not coalesce(p_include_deleted, false) and note.deleted_at is null)
    )
  order by
    case when coalesce(p_include_deleted, false) then note.purge_after end asc nulls last,
    note.updated_at desc,
    note.id;
$$;

create function public.delete_note(p_note_id uuid)
returns table (
  note_id uuid,
  deleted_at timestamptz,
  purge_after timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  note_record public.notes%rowtype;
  deletion_time timestamptz := now();
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  select note.*
  into note_record
  from public.notes as note
  where note.id = p_note_id
    and note.owner_id = actor_id
  for update;

  if not found then
    raise exception 'Note is unavailable' using errcode = '42501';
  end if;

  if note_record.deleted_at is not null then
    return query select note_record.id, note_record.deleted_at, note_record.purge_after;
    return;
  end if;

  update public.notes as note
  set
    deleted_at = deletion_time,
    purge_after = deletion_time + interval '30 days',
    purge_claimed_at = null
  where note.id = note_record.id
  returning note.id, note.deleted_at, note.purge_after
  into note_id, deleted_at, purge_after;

  return next;
end;
$$;

create function public.restore_note(p_note_id uuid)
returns table (
  success boolean,
  error_code text,
  note_id uuid,
  publication_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  note_record public.notes%rowtype;
begin
  if actor_id is null then
    return query select false, 'unauthenticated', null::uuid, null::text;
    return;
  end if;

  select note.*
  into note_record
  from public.notes as note
  where note.id = p_note_id
    and note.owner_id = actor_id
    and note.deleted_at is not null
  for update;

  if not found then
    return query select false, 'note_unavailable', null::uuid, null::text;
    return;
  end if;

  if note_record.purge_after <= now() then
    return query select false, 'recovery_expired', note_record.id, note_record.publication_status;
    return;
  end if;

  if note_record.moderation_status in ('restricted', 'removed') then
    return query select false, 'moderation_blocked', note_record.id, note_record.publication_status;
    return;
  end if;

  update public.notes as note
  set deleted_at = null, purge_after = null, purge_claimed_at = null
  where note.id = note_record.id;

  return query select true, null::text, note_record.id, note_record.publication_status;
end;
$$;

create function public.claim_expired_note_purges(p_limit integer default 25)
returns table (
  note_id uuid,
  object_key text,
  preview_object_key text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select note.id
    from public.notes as note
    where note.deleted_at is not null
      and note.purge_after <= now()
      and not note.retention_hold
      and (
        note.purge_claimed_at is null
        or note.purge_claimed_at < now() - interval '15 minutes'
      )
    order by note.purge_after, note.id
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  ), updated as (
    update public.notes as note
    set purge_claimed_at = now()
    from candidates
    where note.id = candidates.id
    returning note.id
  )
  select
    updated.id,
    asset.object_key,
    asset.preview_object_key
  from updated
  left join public.note_assets as asset on asset.note_id = updated.id;
end;
$$;

create function public.finalize_note_purge(p_note_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  note_record public.notes%rowtype;
  asset_record public.note_assets%rowtype;
begin
  select note.*
  into note_record
  from public.notes as note
  where note.id = p_note_id
    and note.deleted_at is not null
    and note.purge_after <= now()
    and not note.retention_hold
    and note.purge_claimed_at is not null
  for update;

  if not found then
    return false;
  end if;

  select asset.*
  into asset_record
  from public.note_assets as asset
  where asset.note_id = note_record.id;

  if found and (
    exists (
      select 1 from storage.objects as object
      where object.bucket_id = 'note-files'
        and object.name = asset_record.object_key
    )
    or (
      asset_record.preview_object_key is not null
      and exists (
        select 1 from storage.objects as object
        where object.bucket_id = 'note-files'
          and object.name = asset_record.preview_object_key
      )
    )
  ) then
    return false;
  end if;

  delete from public.notes as note
  where note.id = note_record.id;

  return found;
end;
$$;

revoke all on function public.list_owned_notes(boolean)
  from public, anon, authenticated;
revoke all on function public.delete_note(uuid)
  from public, anon, authenticated;
revoke all on function public.restore_note(uuid)
  from public, anon, authenticated;
revoke all on function public.claim_expired_note_purges(integer)
  from public, anon, authenticated;
revoke all on function public.finalize_note_purge(uuid)
  from public, anon, authenticated;

grant execute on function public.list_owned_notes(boolean) to authenticated;
grant execute on function public.delete_note(uuid) to authenticated;
grant execute on function public.restore_note(uuid) to authenticated;

comment on function public.list_owned_notes(boolean) is
  'Returns safe lifecycle and asset metadata for the authenticated owner only.';
comment on function public.delete_note(uuid) is
  'Soft-deletes an owned note into an exact 30-day recovery window.';
comment on function public.restore_note(uuid) is
  'Restores an owned note before its recovery deadline unless moderation blocks it.';
comment on function public.claim_expired_note_purges(integer) is
  'Privileged, idempotent claim step for scheduled expired-note storage cleanup.';
comment on function public.finalize_note_purge(uuid) is
  'Privileged final step that deletes expired note metadata after storage cleanup.';
