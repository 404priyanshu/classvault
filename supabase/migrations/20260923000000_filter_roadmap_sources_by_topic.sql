-- Roadmap sources are now chosen by topic.
--
-- create_roadmap_source_snapshot used to copy every plan-eligible note into the
-- snapshot regardless of the topic the student typed, so an "Operating Systems"
-- roadmap cited every public note on the platform. The deterministic generator
-- hid this by citing everything at once; a model asked to ground a plan in
-- those notes cannot. Eligibility is unchanged -- list_plan_eligible_roadmap_sources
-- still decides what a student may use -- and relevance is applied on top.

/**
 * The topic as an OR-of-prefixes tsquery, or null when nothing useful is left.
 *
 * Words are lowercased and reduced to letters and digits, which is also what
 * makes them safe to splice into to_tsquery. Short words and filler are dropped
 * so "Intro to OS and networks" does not match every note containing "and".
 */
create function public.roadmap_topic_query(p_topic text)
returns tsquery
language sql
immutable
set search_path = ''
as $$
  select case
    when count(*) = 0 then null
    else to_tsquery('simple', string_agg(word || ':*', ' | '))
  end
  from (
    select distinct word
    from regexp_split_to_table(lower(coalesce(p_topic, '')), '[^a-z0-9]+') as word
    where char_length(word) >= 3
      and word not in (
        'and', 'the', 'for', 'with', 'from', 'into', 'intro', 'introduction',
        'basics', 'notes', 'unit', 'exam', 'revision', 'study', 'chapter'
      )
  ) as words;
$$;

create or replace function public.create_roadmap_source_snapshot(
  p_topic text,
  p_study_mode text
)
returns table (
  roadmap_id uuid,
  generation_plan text,
  source_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  created_roadmap_id uuid := gen_random_uuid();
  selected_plan text := public.current_roadmap_plan();
  inserted_source_count bigint;
  topic_text text := lower(trim(coalesce(p_topic, '')));
  topic_terms tsquery := public.roadmap_topic_query(p_topic);
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if not public.is_notes_eligible() then
    raise exception 'Complete onboarding before creating a roadmap'
      using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_topic, ''))) not between 3 and 160 then
    raise exception 'Roadmap topic must be between 3 and 160 characters'
      using errcode = '22023';
  end if;

  if p_study_mode not in ('indepth', 'exam') then
    raise exception 'Invalid roadmap study mode'
      using errcode = '22023';
  end if;

  insert into public.study_roadmaps (
    id,
    owner_id,
    title,
    topic,
    study_mode,
    generation_plan,
    status
  )
  values (
    created_roadmap_id,
    actor_id,
    trim(p_topic) || ' roadmap',
    trim(p_topic),
    p_study_mode,
    selected_plan,
    'draft'
  );

  -- A note matches when its subject is the topic, or its title, tags, or
  -- extracted text contain the topic's words. A subject match ranks first:
  -- it is the uploader saying what the note is about, where a word match can be
  -- a passing mention. Capped, because a model reads at most a dozen notes and
  -- a snapshot of hundreds would only fill the closing section.
  insert into public.roadmap_sources (
    roadmap_id,
    note_id,
    source_scope,
    source_university_id,
    title_snapshot,
    visibility_snapshot
  )
  select
    created_roadmap_id,
    ranked.note_id,
    ranked.source_scope,
    ranked.source_university_id,
    ranked.title_snapshot,
    ranked.visibility_snapshot
  from (
    select
      source.*,
      (subject.id is not null and (
        lower(subject.name) = topic_text
        or lower(subject.slug) = replace(topic_text, ' ', '-')
        or (subject.code is not null and lower(subject.code) = topic_text)
      )) as subject_match,
      case
        when topic_terms is null then 0::real
        else ts_rank_cd(
          setweight(to_tsvector('simple', coalesce(note.title, '')), 'A')
            || setweight(to_tsvector('simple', array_to_string(coalesce(note.tags, '{}'), ' ')), 'A')
            || setweight(to_tsvector('simple', coalesce(subject.name, '')), 'A')
            || setweight(to_tsvector('simple', coalesce(note.description, '')), 'B')
            || coalesce(document.search_document, ''::tsvector),
          topic_terms
        )
      end as text_rank
    from public.list_plan_eligible_roadmap_sources(actor_id, selected_plan) as source
    join public.notes as note on note.id = source.note_id
    left join public.subjects as subject on subject.id = note.subject_id
    left join public.note_search_documents as document on document.note_id = note.id
  ) as ranked
  where ranked.subject_match or ranked.text_rank > 0
  order by ranked.subject_match desc, ranked.text_rank desc, ranked.note_id
  limit 40;

  get diagnostics inserted_source_count = row_count;

  return query select created_roadmap_id, selected_plan, inserted_source_count;
end;
$$;

revoke all on function public.roadmap_topic_query(text) from public, anon, authenticated;
