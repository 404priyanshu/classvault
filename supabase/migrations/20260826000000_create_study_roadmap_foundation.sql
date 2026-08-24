-- Static study-roadmap snapshots with source-aware authorization.

create table public.study_roadmaps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  topic text not null,
  study_mode text not null,
  generation_plan text not null default 'free',
  status text not null default 'draft',
  failure_code text,
  created_at timestamptz not null default now(),
  generated_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint study_roadmaps_title_length
    check (char_length(trim(title)) between 3 and 180),
  constraint study_roadmaps_topic_length
    check (char_length(trim(topic)) between 3 and 160),
  constraint study_roadmaps_study_mode
    check (study_mode in ('indepth', 'exam')),
  constraint study_roadmaps_generation_plan
    check (generation_plan in ('free', 'pro')),
  constraint study_roadmaps_status
    check (status in ('draft', 'generating', 'ready', 'failed')),
  constraint study_roadmaps_failure_code_length
    check (failure_code is null or char_length(failure_code) <= 80),
  constraint study_roadmaps_generated_state
    check (
      (status = 'ready' and generated_at is not null)
      or (status <> 'ready' and generated_at is null)
    )
);

create index study_roadmaps_owner_created_idx
  on public.study_roadmaps (owner_id, created_at desc, id);

create table public.roadmap_sources (
  id bigint generated always as identity primary key,
  roadmap_id uuid not null references public.study_roadmaps (id) on delete cascade,
  note_id uuid references public.notes (id) on delete set null,
  source_scope text not null,
  source_university_id bigint references public.universities (id) on delete restrict,
  title_snapshot text not null,
  visibility_snapshot text not null,
  created_at timestamptz not null default now(),
  constraint roadmap_sources_scope
    check (source_scope in ('personal', 'public', 'university')),
  constraint roadmap_sources_title_length
    check (char_length(trim(title_snapshot)) between 3 and 180),
  constraint roadmap_sources_visibility
    check (visibility_snapshot in ('public', 'university')),
  constraint roadmap_sources_university_scope
    check (
      (visibility_snapshot = 'public' and source_university_id is null)
      or (visibility_snapshot = 'university' and source_university_id is not null)
    ),
  constraint roadmap_sources_scope_consistency
    check (
      source_scope = 'personal'
      or source_scope = visibility_snapshot
    )
);

create index roadmap_sources_roadmap_idx
  on public.roadmap_sources (roadmap_id, id);

create unique index roadmap_sources_note_idx
  on public.roadmap_sources (roadmap_id, note_id)
  where note_id is not null;

create index roadmap_sources_note_lookup_idx
  on public.roadmap_sources (note_id)
  where note_id is not null;

create index roadmap_sources_university_idx
  on public.roadmap_sources (source_university_id)
  where source_university_id is not null;

create table public.roadmap_sections (
  id bigint generated always as identity primary key,
  roadmap_id uuid not null references public.study_roadmaps (id) on delete cascade,
  position integer not null,
  title text not null,
  timeframe_label text not null,
  summary text not null,
  created_at timestamptz not null default now(),
  constraint roadmap_sections_position check (position between 1 and 20),
  constraint roadmap_sections_title_length
    check (char_length(trim(title)) between 2 and 160),
  constraint roadmap_sections_timeframe_length
    check (char_length(trim(timeframe_label)) between 1 and 80),
  constraint roadmap_sections_summary_length
    check (char_length(trim(summary)) between 2 and 4000),
  unique (roadmap_id, position)
);

create table public.roadmap_section_sources (
  section_id bigint not null references public.roadmap_sections (id) on delete cascade,
  source_id bigint not null references public.roadmap_sources (id) on delete cascade,
  primary key (section_id, source_id)
);

create index roadmap_section_sources_source_idx
  on public.roadmap_section_sources (source_id, section_id);

create table public.roadmap_tasks (
  id bigint generated always as identity primary key,
  section_id bigint not null references public.roadmap_sections (id) on delete cascade,
  position integer not null,
  task_text text not null,
  created_at timestamptz not null default now(),
  constraint roadmap_tasks_position check (position between 1 and 30),
  constraint roadmap_tasks_text_length
    check (char_length(trim(task_text)) between 2 and 500),
  unique (section_id, position)
);

create table public.roadmap_task_progress (
  task_id bigint primary key references public.roadmap_tasks (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now()
);

create index roadmap_task_progress_owner_idx
  on public.roadmap_task_progress (owner_id, completed_at desc);

create table public.roadmap_share_links (
  roadmap_id uuid primary key references public.study_roadmaps (id) on delete cascade,
  share_token uuid not null unique default gen_random_uuid(),
  enabled_at timestamptz not null default now(),
  revoked_at timestamptz
);

create trigger study_roadmaps_set_updated_at
before update on public.study_roadmaps
for each row execute function public.set_profile_updated_at();

create function public.current_roadmap_plan()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  -- Billing/entitlement integration replaces this function without changing
  -- roadmap source-selection callers. Until then every student is Free.
  select 'free'::text;
$$;

create function public.list_plan_eligible_roadmap_sources(
  p_owner_id uuid,
  p_plan text
)
returns table (
  note_id uuid,
  source_scope text,
  source_university_id bigint,
  title_snapshot text,
  visibility_snapshot text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    note.id,
    case
      when note.owner_id = p_owner_id then 'personal'
      else note.visibility
    end,
    note.university_id,
    note.title,
    note.visibility
  from public.notes as note
  join public.note_assets as asset on asset.note_id = note.id
  where p_plan in ('free', 'pro')
    and note.publication_status = 'published'
    and note.deleted_at is null
    and note.moderation_status in ('clear', 'under_review')
    and asset.processing_status = 'ready'
    and (
      note.owner_id = p_owner_id
      or note.visibility = 'public'
      or (
        p_plan = 'pro'
        and note.visibility = 'university'
        and exists (
          select 1
          from public.university_memberships as membership
          where membership.user_id = p_owner_id
            and membership.university_id = note.university_id
            and membership.status = 'verified'
        )
      )
    )
  order by note.published_at desc, note.id desc;
$$;

create function public.preview_roadmap_source_eligibility()
returns table (
  generation_plan text,
  personal_count bigint,
  public_count bigint,
  eligible_university_count bigint,
  pro_university_count bigint,
  total_eligible_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  selected_plan text := public.current_roadmap_plan();
begin
  if actor_id is null or not public.is_notes_eligible() then
    return;
  end if;

  return query
  with free_sources as (
    select * from public.list_plan_eligible_roadmap_sources(actor_id, selected_plan)
  ), pro_sources as (
    select * from public.list_plan_eligible_roadmap_sources(actor_id, 'pro')
  )
  select
    selected_plan,
    count(*) filter (where free_sources.source_scope = 'personal'),
    count(*) filter (where free_sources.source_scope = 'public'),
    count(*) filter (where free_sources.source_scope = 'university'),
    (select count(*) from pro_sources where pro_sources.source_scope = 'university'),
    count(*)
  from free_sources;
end;
$$;

create function public.create_roadmap_source_snapshot(
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
    source.note_id,
    source.source_scope,
    source.source_university_id,
    source.title_snapshot,
    source.visibility_snapshot
  from public.list_plan_eligible_roadmap_sources(actor_id, selected_plan) as source;

  get diagnostics inserted_source_count = row_count;

  return query select created_roadmap_id, selected_plan, inserted_source_count;
end;
$$;

create function public.save_roadmap_snapshot(
  p_roadmap_id uuid,
  p_title text,
  p_sections jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  roadmap_record public.study_roadmaps%rowtype;
  section_entry record;
  task_entry record;
  source_note_id_text text;
  created_section_id bigint;
  section_source_count integer;
begin
  if coalesce((select auth.role()), '') not in ('service_role', 'postgres') then
    raise exception 'Roadmap snapshots require the service role'
      using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_title, ''))) not between 3 and 180 then
    raise exception 'Invalid roadmap title'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_sections) <> 'array'
    or jsonb_array_length(p_sections) not between 1 and 20 then
    raise exception 'Roadmap sections must be a non-empty array'
      using errcode = '22023';
  end if;

  select roadmap.* into roadmap_record
  from public.study_roadmaps as roadmap
  where roadmap.id = p_roadmap_id
    and roadmap.status in ('draft', 'generating', 'failed')
  for update;

  if not found then
    return false;
  end if;

  delete from public.roadmap_sections as section
  where section.roadmap_id = p_roadmap_id;

  for section_entry in
    select value, ordinality::integer as position
    from jsonb_array_elements(p_sections) with ordinality
  loop
    if jsonb_typeof(section_entry.value) <> 'object'
      or char_length(trim(coalesce(section_entry.value ->> 'title', ''))) not between 2 and 160
      or char_length(trim(coalesce(section_entry.value ->> 'timeframe', ''))) not between 1 and 80
      or char_length(trim(coalesce(section_entry.value ->> 'summary', ''))) not between 2 and 4000
      or jsonb_typeof(section_entry.value -> 'tasks') <> 'array'
      or jsonb_array_length(section_entry.value -> 'tasks') not between 1 and 30
      or jsonb_typeof(section_entry.value -> 'sourceNoteIds') <> 'array'
      or jsonb_array_length(section_entry.value -> 'sourceNoteIds') not between 1 and 100 then
      raise exception 'Invalid roadmap section payload'
        using errcode = '22023';
    end if;

    select count(*) into section_source_count
    from jsonb_array_elements_text(section_entry.value -> 'sourceNoteIds') as requested(note_id)
    join public.roadmap_sources as source
      on source.roadmap_id = p_roadmap_id
      and source.note_id = requested.note_id::uuid;

    if section_source_count <> jsonb_array_length(section_entry.value -> 'sourceNoteIds') then
      raise exception 'Roadmap section referenced an ineligible note'
        using errcode = '42501';
    end if;

    insert into public.roadmap_sections (
      roadmap_id,
      position,
      title,
      timeframe_label,
      summary
    )
    values (
      p_roadmap_id,
      section_entry.position,
      trim(section_entry.value ->> 'title'),
      trim(section_entry.value ->> 'timeframe'),
      trim(section_entry.value ->> 'summary')
    )
    returning id into created_section_id;

    for task_entry in
      select value, ordinality::integer as position
      from jsonb_array_elements_text(section_entry.value -> 'tasks') with ordinality
    loop
      if char_length(trim(task_entry.value)) not between 2 and 500 then
        raise exception 'Invalid roadmap task'
          using errcode = '22023';
      end if;

      insert into public.roadmap_tasks (section_id, position, task_text)
      values (created_section_id, task_entry.position, trim(task_entry.value));
    end loop;

    for source_note_id_text in
      select distinct value
      from jsonb_array_elements_text(section_entry.value -> 'sourceNoteIds')
    loop
      insert into public.roadmap_section_sources (section_id, source_id)
      select created_section_id, source.id
      from public.roadmap_sources as source
      where source.roadmap_id = p_roadmap_id
        and source.note_id = source_note_id_text::uuid;
    end loop;
  end loop;

  update public.study_roadmaps as roadmap
  set title = trim(p_title),
      status = 'ready',
      failure_code = null,
      generated_at = now()
  where roadmap.id = p_roadmap_id;

  return true;
end;
$$;

create function public.can_view_roadmap_source(
  p_source_id bigint,
  p_viewer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roadmap_sources as source
    join public.study_roadmaps as roadmap on roadmap.id = source.roadmap_id
    join public.notes as note on note.id = source.note_id
    join public.note_assets as asset on asset.note_id = note.id
    where source.id = p_source_id
      and note.publication_status = 'published'
      and note.deleted_at is null
      and note.moderation_status in ('clear', 'under_review')
      and asset.processing_status = 'ready'
      and (
        note.visibility = 'public'
        or (
          p_viewer_id = roadmap.owner_id
          and source.source_scope = 'personal'
        )
        or (
          p_viewer_id is not null
          and note.visibility = 'university'
          and exists (
            select 1
            from public.university_memberships as membership
            where membership.user_id = p_viewer_id
              and membership.university_id = note.university_id
              and membership.status = 'verified'
          )
        )
      )
  );
$$;

create function public.can_view_roadmap_section(
  p_section_id bigint,
  p_viewer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roadmap_section_sources as section_source
    where section_source.section_id = p_section_id
  )
  and not exists (
    select 1
    from public.roadmap_section_sources as section_source
    where section_source.section_id = p_section_id
      and not public.can_view_roadmap_source(section_source.source_id, p_viewer_id)
  );
$$;

create function public.list_owned_roadmaps()
returns table (
  roadmap_id uuid,
  title text,
  topic text,
  study_mode text,
  generation_plan text,
  status text,
  created_at timestamptz,
  generated_at timestamptz,
  source_count bigint,
  section_count bigint,
  completed_task_count bigint,
  total_task_count bigint,
  sharing_enabled boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    roadmap.id,
    roadmap.title,
    roadmap.topic,
    roadmap.study_mode,
    roadmap.generation_plan,
    roadmap.status,
    roadmap.created_at,
    roadmap.generated_at,
    (select count(*) from public.roadmap_sources as source where source.roadmap_id = roadmap.id),
    (select count(*) from public.roadmap_sections as section where section.roadmap_id = roadmap.id),
    (
      select count(*)
      from public.roadmap_task_progress as progress
      join public.roadmap_tasks as task on task.id = progress.task_id
      join public.roadmap_sections as section on section.id = task.section_id
      where section.roadmap_id = roadmap.id
        and progress.owner_id = roadmap.owner_id
    ),
    (
      select count(*)
      from public.roadmap_tasks as task
      join public.roadmap_sections as section on section.id = task.section_id
      where section.roadmap_id = roadmap.id
    ),
    exists (
      select 1
      from public.roadmap_share_links as share
      where share.roadmap_id = roadmap.id
        and share.revoked_at is null
    )
  from public.study_roadmaps as roadmap
  where roadmap.owner_id = (select auth.uid())
  order by roadmap.created_at desc, roadmap.id desc;
$$;

create function public.set_roadmap_task_progress(
  p_task_id bigint,
  p_completed boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  roadmap_owner_id uuid;
begin
  select roadmap.owner_id into roadmap_owner_id
  from public.roadmap_tasks as task
  join public.roadmap_sections as section on section.id = task.section_id
  join public.study_roadmaps as roadmap on roadmap.id = section.roadmap_id
  where task.id = p_task_id
    and roadmap.status = 'ready';

  if actor_id is null or roadmap_owner_id is distinct from actor_id then
    return false;
  end if;

  if coalesce(p_completed, false) then
    insert into public.roadmap_task_progress (task_id, owner_id)
    values (p_task_id, actor_id)
    on conflict (task_id) do update
    set owner_id = excluded.owner_id,
        completed_at = now();
  else
    delete from public.roadmap_task_progress as progress
    where progress.task_id = p_task_id
      and progress.owner_id = actor_id;
  end if;

  return true;
end;
$$;

create function public.set_roadmap_sharing(
  p_roadmap_id uuid,
  p_enabled boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  existing_share public.roadmap_share_links%rowtype;
  returned_token uuid;
begin
  if not exists (
    select 1
    from public.study_roadmaps as roadmap
    where roadmap.id = p_roadmap_id
      and roadmap.owner_id = actor_id
      and roadmap.status = 'ready'
  ) then
    return null;
  end if;

  if coalesce(p_enabled, false) then
    select share.* into existing_share
    from public.roadmap_share_links as share
    where share.roadmap_id = p_roadmap_id
    for update;

    if found and existing_share.revoked_at is null then
      return existing_share.share_token;
    end if;

    returned_token := gen_random_uuid();
    insert into public.roadmap_share_links (
      roadmap_id,
      share_token,
      enabled_at,
      revoked_at
    )
    values (p_roadmap_id, returned_token, now(), null)
    on conflict (roadmap_id) do update
    set share_token = excluded.share_token,
        enabled_at = excluded.enabled_at,
        revoked_at = null;

    return returned_token;
  end if;

  update public.roadmap_share_links as share
  set revoked_at = now()
  where share.roadmap_id = p_roadmap_id
    and share.revoked_at is null;

  return null;
end;
$$;

create function public.get_roadmap_snapshot(
  p_roadmap_id uuid,
  p_share_token uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  roadmap_record public.study_roadmaps%rowtype;
  is_owner boolean;
  has_share_access boolean;
  sections_json jsonb;
begin
  select roadmap.* into roadmap_record
  from public.study_roadmaps as roadmap
  where roadmap.id = p_roadmap_id
    and roadmap.status = 'ready';

  if not found then
    return null;
  end if;

  is_owner := coalesce(actor_id = roadmap_record.owner_id, false);
  has_share_access := p_share_token is not null and exists (
    select 1
    from public.roadmap_share_links as share
    where share.roadmap_id = p_roadmap_id
      and share.share_token = p_share_token
      and share.revoked_at is null
  );

  if not is_owner and not has_share_access then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      case
        when public.can_view_roadmap_section(section.id, actor_id) then
          jsonb_build_object(
            'available', true,
            'id', section.id,
            'position', section.position,
            'title', section.title,
            'timeframe', section.timeframe_label,
            'summary', section.summary,
            'tasks', (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'id', task.id,
                    'position', task.position,
                    'text', task.task_text,
                    'completed', case
                      when is_owner then exists (
                        select 1
                        from public.roadmap_task_progress as progress
                        where progress.task_id = task.id
                          and progress.owner_id = actor_id
                      )
                      else null
                    end
                  ) order by task.position, task.id
                ),
                '[]'::jsonb
              )
              from public.roadmap_tasks as task
              where task.section_id = section.id
            ),
            'sources', (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'noteId', source.note_id,
                    'title', source.title_snapshot,
                    'scope', source.source_scope,
                    'linkAvailable', actor_id is not null
                      and source.note_id is not null
                      and public.can_consume_note(source.note_id)
                      and (
                        source.visibility_snapshot = 'public'
                        or public.has_verified_university_membership(
                          source.source_university_id
                        )
                      )
                  ) order by source.id
                ),
                '[]'::jsonb
              )
              from public.roadmap_section_sources as section_source
              join public.roadmap_sources as source on source.id = section_source.source_id
              where section_source.section_id = section.id
            )
          )
        else
          jsonb_build_object(
            'available', false,
            'id', section.id,
            'position', section.position,
            'title', null,
            'timeframe', null,
            'summary', null,
            'tasks', '[]'::jsonb,
            'sources', '[]'::jsonb
          )
      end
      order by section.position, section.id
    ),
    '[]'::jsonb
  ) into sections_json
  from public.roadmap_sections as section
  where section.roadmap_id = p_roadmap_id;

  return jsonb_build_object(
    'id', roadmap_record.id,
    'title', roadmap_record.title,
    'topic', roadmap_record.topic,
    'studyMode', roadmap_record.study_mode,
    'generationPlan', roadmap_record.generation_plan,
    'generatedAt', roadmap_record.generated_at,
    'isOwner', is_owner,
    'sections', sections_json
  );
end;
$$;

alter table public.study_roadmaps enable row level security;
alter table public.study_roadmaps force row level security;
alter table public.roadmap_sources enable row level security;
alter table public.roadmap_sources force row level security;
alter table public.roadmap_sections enable row level security;
alter table public.roadmap_sections force row level security;
alter table public.roadmap_section_sources enable row level security;
alter table public.roadmap_section_sources force row level security;
alter table public.roadmap_tasks enable row level security;
alter table public.roadmap_tasks force row level security;
alter table public.roadmap_task_progress enable row level security;
alter table public.roadmap_task_progress force row level security;
alter table public.roadmap_share_links enable row level security;
alter table public.roadmap_share_links force row level security;

revoke all on table public.study_roadmaps from anon, authenticated;
revoke all on table public.roadmap_sources from anon, authenticated;
revoke all on table public.roadmap_sections from anon, authenticated;
revoke all on table public.roadmap_section_sources from anon, authenticated;
revoke all on table public.roadmap_tasks from anon, authenticated;
revoke all on table public.roadmap_task_progress from anon, authenticated;
revoke all on table public.roadmap_share_links from anon, authenticated;

revoke all on function public.current_roadmap_plan() from public, anon;
revoke all on function public.list_plan_eligible_roadmap_sources(uuid, text) from public, anon, authenticated;
revoke all on function public.preview_roadmap_source_eligibility() from public, anon;
revoke all on function public.create_roadmap_source_snapshot(text, text) from public, anon;
revoke all on function public.save_roadmap_snapshot(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.can_view_roadmap_source(bigint, uuid) from public, anon, authenticated;
revoke all on function public.can_view_roadmap_section(bigint, uuid) from public, anon, authenticated;
revoke all on function public.list_owned_roadmaps() from public, anon;
revoke all on function public.set_roadmap_task_progress(bigint, boolean) from public, anon;
revoke all on function public.set_roadmap_sharing(uuid, boolean) from public, anon;
revoke all on function public.get_roadmap_snapshot(uuid, uuid) from public;

grant execute on function public.current_roadmap_plan() to authenticated;
grant execute on function public.preview_roadmap_source_eligibility() to authenticated;
grant execute on function public.create_roadmap_source_snapshot(text, text) to authenticated;
grant execute on function public.save_roadmap_snapshot(uuid, text, jsonb) to service_role;
grant execute on function public.list_owned_roadmaps() to authenticated;
grant execute on function public.set_roadmap_task_progress(bigint, boolean) to authenticated;
grant execute on function public.set_roadmap_sharing(uuid, boolean) to authenticated;
grant execute on function public.get_roadmap_snapshot(uuid, uuid) to anon, authenticated;

comment on table public.study_roadmaps is
  'Private static roadmap snapshots; generation plan is captured when sources are selected.';
comment on table public.roadmap_sources is
  'Source-note snapshots with current note references retained for authorization rechecks.';
comment on function public.get_roadmap_snapshot(uuid, uuid) is
  'Returns owner or share-token roadmap JSON with inaccessible source-derived sections withheld.';
