-- Permission-safe metadata indexing and server-owned PDF extraction.

alter table public.note_search_documents
  drop constraint note_search_documents_status;

alter table public.note_search_documents
  add constraint note_search_documents_status
  check (extraction_status in ('pending', 'processing', 'ready', 'failed', 'unsupported'));

create or replace function public.sync_note_search_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_text text;
  existing_status text;
  metadata_document tsvector;
begin
  select document.extracted_text, document.extraction_status
  into existing_text, existing_status
  from public.note_search_documents as document
  where document.note_id = new.id;

  metadata_document :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(new.description, '')), 'B')
    || setweight(to_tsvector('simple', array_to_string(new.tags, ' ')), 'B')
    || setweight(
      to_tsvector(
        'simple',
        coalesce((select subject.name from public.subjects as subject where subject.id = new.subject_id), '')
      ),
      'C'
    );

  insert into public.note_search_documents (
    note_id,
    extraction_status,
    extracted_text,
    search_document,
    extractor_version
  )
  values (
    new.id,
    coalesce(existing_status, 'pending'),
    existing_text,
    metadata_document || coalesce(to_tsvector('simple', existing_text), ''::tsvector),
    case when existing_text is null then 'metadata-v1' else null end
  )
  on conflict (note_id) do update
  set search_document = excluded.search_document,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists notes_sync_search_metadata on public.notes;
create trigger notes_sync_search_metadata
after insert or update of title, description, tags, subject_id on public.notes
for each row execute function public.sync_note_search_metadata();

insert into public.note_search_documents as existing (
  note_id,
  extraction_status,
  search_document,
  extractor_version
)
select
  note.id,
  'pending',
  setweight(to_tsvector('simple', coalesce(note.title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(note.description, '')), 'B')
    || setweight(to_tsvector('simple', array_to_string(note.tags, ' ')), 'B')
    || setweight(to_tsvector('simple', coalesce(subject.name, '')), 'C'),
  'metadata-v1'
from public.notes as note
left join public.subjects as subject on subject.id = note.subject_id
on conflict (note_id) do update
set search_document = excluded.search_document
      || coalesce(to_tsvector('simple', existing.extracted_text), ''::tsvector),
    extractor_version = coalesce(existing.extractor_version, excluded.extractor_version),
    updated_at = now();

create or replace function public.claim_pending_note_extractions(p_limit integer default 10)
returns table (
  detected_mime_type text,
  note_id uuid,
  object_key text,
  title text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '') not in ('service_role', 'postgres') then
    raise exception 'Extraction workers require the service role'
      using errcode = '42501';
  end if;

  return query
  with candidates as (
    select
      document.note_id,
      asset.object_key,
      asset.detected_mime_type
    from public.note_search_documents as document
    join public.notes as note on note.id = document.note_id
    join public.note_assets as asset on asset.note_id = note.id
    where note.publication_status = 'published'
      and note.deleted_at is null
      and note.moderation_status in ('clear', 'under_review')
      and asset.processing_status = 'ready'
      and (
        document.extraction_status = 'pending'
        or (
          document.extraction_status = 'processing'
          and document.updated_at < now() - interval '15 minutes'
        )
    )
    order by document.updated_at asc, document.note_id asc
    limit greatest(least(coalesce(p_limit, 10), 50), 1)
    for update of document skip locked
  ), claimed as (
    update public.note_search_documents as document
    set extraction_status = 'processing',
        updated_at = now()
    from candidates
    where document.note_id = candidates.note_id
    returning document.note_id
  )
  select asset.detected_mime_type, note.id, asset.object_key, note.title
  from claimed
  join public.notes as note on note.id = claimed.note_id
  join public.note_assets as asset on asset.note_id = note.id;
end;
$$;

create or replace function public.complete_note_extraction(
  p_extraction_status text,
  p_extracted_text text,
  p_extractor_version text,
  p_note_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_text text := nullif(trim(coalesce(p_extracted_text, '')), '');
  note_record public.notes%rowtype;
  metadata_document tsvector;
begin
  if coalesce((select auth.role()), '') not in ('service_role', 'postgres') then
    raise exception 'Extraction workers require the service role'
      using errcode = '42501';
  end if;

  if p_extraction_status not in ('ready', 'failed', 'unsupported') then
    raise exception 'Invalid extraction status'
      using errcode = '22023';
  end if;

  if p_extractor_version is null or char_length(trim(p_extractor_version)) > 80 then
    raise exception 'Invalid extractor version'
      using errcode = '22023';
  end if;

  select note.* into note_record
  from public.notes as note
  where note.id = p_note_id;

  if not found then
    return false;
  end if;

  metadata_document :=
    setweight(to_tsvector('simple', coalesce(note_record.title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(note_record.description, '')), 'B')
    || setweight(to_tsvector('simple', array_to_string(note_record.tags, ' ')), 'B')
    || setweight(
      to_tsvector(
        'simple',
        coalesce((select subject.name from public.subjects as subject where subject.id = note_record.subject_id), '')
      ),
      'C'
    );

  update public.note_search_documents as document
  set extraction_status = p_extraction_status,
      extracted_text = normalized_text,
      search_document = metadata_document || coalesce(to_tsvector('simple', normalized_text), ''::tsvector),
      extractor_version = trim(p_extractor_version),
      updated_at = now()
  where document.note_id = p_note_id;

  return found;
end;
$$;

drop function public.list_notes_for_library(text, bigint, text, text, text, integer, integer);

create function public.list_notes_for_library(
  p_query text,
  p_subject_id bigint,
  p_note_type text,
  p_access text,
  p_sort text,
  p_limit integer,
  p_offset integer
)
returns table (
  id uuid,
  owner_id uuid,
  title text,
  description text,
  note_type text,
  tags text[],
  visibility text,
  published_at timestamptz,
  subject_code text,
  subject_name text,
  average_rating numeric,
  rating_count bigint,
  total_count bigint,
  extraction_status text,
  search_rank real,
  search_snippet text
)
language sql
stable
security definer
set search_path = ''
as $$
  with query_input as (
    select case
      when nullif(trim(coalesce(p_query, '')), '') is null then null
      else plainto_tsquery('simple', trim(p_query))
    end as terms
  ),
  accessible_notes as (
    select
      note.id,
      note.owner_id,
      note.title,
      note.description,
      note.note_type,
      note.tags,
      note.visibility,
      note.published_at,
      note.published_at as sort_published_at,
      subject.code as subject_code,
      subject.name as subject_name,
      summary.average_rating,
      summary.rating_count,
      summary.weighted_score,
      document.extraction_status,
      case
        when query_input.terms is null then 0::real
        else ts_rank_cd(coalesce(document.search_document, ''::tsvector), query_input.terms)
      end as search_rank,
      case
        when query_input.terms is null or document.extracted_text is null then null
        else ts_headline(
          'simple',
          left(document.extracted_text, 500000),
          query_input.terms,
          'MaxFragments=2,MaxWords=18,MinWords=6,StartSel=<mark>,StopSel=</mark>'
        )
      end as search_snippet,
      count(*) over () as total_count
    from public.notes as note
    join public.subjects as subject on subject.id = note.subject_id
    cross join query_input
    left join public.note_search_documents as document
      on document.note_id = note.id
    left join public.note_rating_summaries as summary
      on summary.note_id = note.id
    where note.publication_status = 'published'
      and note.deleted_at is null
      and note.moderation_status in ('clear', 'under_review')
      and (select public.is_notes_eligible())
      and (
        note.owner_id = (select auth.uid())
        or note.visibility = 'public'
        or (
          note.visibility = 'university'
          and (select public.has_verified_university_membership(note.university_id))
        )
      )
      and (
        query_input.terms is null
        or document.search_document @@ query_input.terms
        or note.title ilike '%' || trim(p_query) || '%'
        or note.description ilike '%' || trim(p_query) || '%'
      )
      and (p_subject_id is null or note.subject_id = p_subject_id)
      and (
        p_note_type is null
        or p_note_type = 'all'
        or note.note_type = p_note_type
      )
      and (
        p_access is null
        or p_access not in ('public', 'university')
        or note.visibility = p_access
      )
  )
  select
    accessible_notes.id,
    accessible_notes.owner_id,
    accessible_notes.title,
    accessible_notes.description,
    accessible_notes.note_type,
    accessible_notes.tags,
    accessible_notes.visibility,
    accessible_notes.published_at,
    accessible_notes.subject_code,
    accessible_notes.subject_name,
    accessible_notes.average_rating,
    accessible_notes.rating_count,
    accessible_notes.total_count,
    accessible_notes.extraction_status,
    accessible_notes.search_rank,
    accessible_notes.search_snippet
  from accessible_notes
  order by
    case when p_query is not null and trim(p_query) <> '' then accessible_notes.search_rank end desc,
    case when p_sort = 'oldest' then accessible_notes.sort_published_at end asc,
    case when p_sort = 'oldest' then accessible_notes.id end asc,
    case when p_sort = 'top' then accessible_notes.weighted_score end desc nulls last,
    case when p_sort = 'top' then accessible_notes.rating_count end desc nulls last,
    case when p_sort = 'top' then accessible_notes.sort_published_at end desc,
    case when p_sort = 'top' then accessible_notes.id end desc,
    case when p_sort = 'oldest' then null else accessible_notes.sort_published_at end desc,
    case when p_sort = 'oldest' then null else accessible_notes.id end desc
  limit greatest(least(coalesce(p_limit, 10), 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.sync_note_search_metadata() from public;
revoke all on function public.claim_pending_note_extractions(integer) from public, anon, authenticated;
revoke all on function public.complete_note_extraction(text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.list_notes_for_library(text, bigint, text, text, text, integer, integer) from public;
revoke all on function public.list_notes_for_library(text, bigint, text, text, text, integer, integer) from anon;
revoke all on function public.list_notes_for_library(text, bigint, text, text, text, integer, integer) from authenticated;

grant execute on function public.list_notes_for_library(text, bigint, text, text, text, integer, integer) to authenticated;
