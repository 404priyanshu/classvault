-- Service-role roadmap generation claim and failure boundaries.

alter table public.study_roadmaps
  add column generator_key text,
  add column generation_attempts integer not null default 0,
  add constraint study_roadmaps_generator_key_length
    check (generator_key is null or char_length(generator_key) between 2 and 80),
  add constraint study_roadmaps_generation_attempts
    check (generation_attempts between 0 and 100);

create function public.claim_roadmap_generation(
  p_roadmap_id uuid,
  p_owner_id uuid,
  p_generator_key text
)
returns table (
  claim_status text,
  roadmap_id uuid,
  topic text,
  study_mode text,
  source_count bigint,
  sources jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  roadmap_record public.study_roadmaps%rowtype;
  roadmap_source_count bigint;
  source_payload jsonb;
  normalized_generator_key text := lower(trim(coalesce(p_generator_key, '')));
begin
  if coalesce((select auth.role()), '') not in ('service_role', 'postgres') then
    raise exception 'Roadmap generation requires the service role'
      using errcode = '42501';
  end if;

  if normalized_generator_key !~ '^[a-z0-9_-]{2,80}$' then
    raise exception 'Invalid roadmap generator key'
      using errcode = '22023';
  end if;

  select roadmap.*
  into roadmap_record
  from public.study_roadmaps as roadmap
  where roadmap.id = p_roadmap_id
    and roadmap.owner_id = p_owner_id
  for update;

  if not found then
    return query
    select 'not_found'::text, p_roadmap_id, null::text, null::text, 0::bigint, '[]'::jsonb;
    return;
  end if;

  if roadmap_record.status = 'ready' then
    return query
    select 'not_retryable'::text, roadmap_record.id, roadmap_record.topic,
      roadmap_record.study_mode, 0::bigint, '[]'::jsonb;
    return;
  end if;

  if roadmap_record.generation_attempts >= 100 then
    return query
    select 'not_retryable'::text, roadmap_record.id, roadmap_record.topic,
      roadmap_record.study_mode, 0::bigint, '[]'::jsonb;
    return;
  end if;

  if roadmap_record.status = 'generating'
    and roadmap_record.updated_at >= now() - interval '2 minutes' then
    return query
    select 'already_running'::text, roadmap_record.id, roadmap_record.topic,
      roadmap_record.study_mode, 0::bigint, '[]'::jsonb;
    return;
  end if;

  if roadmap_record.status not in ('draft', 'failed', 'generating') then
    return query
    select 'not_retryable'::text, roadmap_record.id, roadmap_record.topic,
      roadmap_record.study_mode, 0::bigint, '[]'::jsonb;
    return;
  end if;

  select count(*)
  into roadmap_source_count
  from public.roadmap_sources as source
  where source.roadmap_id = roadmap_record.id;

  if roadmap_source_count = 0 then
    update public.study_roadmaps as roadmap
    set status = 'failed',
        failure_code = 'no_sources',
        generated_at = null
    where roadmap.id = roadmap_record.id;

    return query
    select 'no_sources'::text, roadmap_record.id, roadmap_record.topic,
      roadmap_record.study_mode, 0::bigint, '[]'::jsonb;
    return;
  end if;

  if exists (
    select 1
    from public.roadmap_sources as source
    where source.roadmap_id = roadmap_record.id
      and not public.can_view_roadmap_source(source.id, roadmap_record.owner_id)
  ) then
    update public.study_roadmaps as roadmap
    set status = 'failed',
        failure_code = 'source_access_changed',
        generated_at = null
    where roadmap.id = roadmap_record.id;

    return query
    select 'source_access_changed'::text, roadmap_record.id,
      roadmap_record.topic, roadmap_record.study_mode,
      roadmap_source_count, '[]'::jsonb;
    return;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'noteId', source.note_id,
        'title', source.title_snapshot,
        'scope', source.source_scope,
        'visibility', source.visibility_snapshot,
        'extractionStatus', document.extraction_status,
        'excerpt', case
          when document.extraction_status = 'ready'
            then left(document.extracted_text, 12000)
          else null
        end
      )
      order by source.id
    ),
    '[]'::jsonb
  )
  into source_payload
  from public.roadmap_sources as source
  left join public.note_search_documents as document
    on document.note_id = source.note_id
  where source.roadmap_id = roadmap_record.id;

  update public.study_roadmaps as roadmap
  set status = 'generating',
      failure_code = null,
      generated_at = null,
      generator_key = normalized_generator_key,
      generation_attempts = roadmap.generation_attempts + 1
  where roadmap.id = roadmap_record.id;

  return query
  select 'claimed'::text, roadmap_record.id, roadmap_record.topic,
    roadmap_record.study_mode, roadmap_source_count, source_payload;
end;
$$;

create function public.mark_roadmap_generation_failed(
  p_roadmap_id uuid,
  p_owner_id uuid,
  p_failure_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_failure_code text := lower(trim(coalesce(p_failure_code, '')));
begin
  if coalesce((select auth.role()), '') not in ('service_role', 'postgres') then
    raise exception 'Roadmap generation requires the service role'
      using errcode = '42501';
  end if;

  if normalized_failure_code !~ '^[a-z0-9_]{2,80}$' then
    raise exception 'Invalid roadmap failure code'
      using errcode = '22023';
  end if;

  update public.study_roadmaps as roadmap
  set status = 'failed',
      failure_code = normalized_failure_code,
      generated_at = null
  where roadmap.id = p_roadmap_id
    and roadmap.owner_id = p_owner_id
    and roadmap.status = 'generating';

  return found;
end;
$$;

revoke all on function public.claim_roadmap_generation(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.mark_roadmap_generation_failed(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.claim_roadmap_generation(uuid, uuid, text)
  to service_role;
grant execute on function public.mark_roadmap_generation_failed(uuid, uuid, text)
  to service_role;

comment on function public.claim_roadmap_generation(uuid, uuid, text) is
  'Service-role-only atomic roadmap claim with server-owned source excerpts.';
comment on function public.mark_roadmap_generation_failed(uuid, uuid, text) is
  'Service-role-only safe failure transition for a claimed roadmap generation.';
