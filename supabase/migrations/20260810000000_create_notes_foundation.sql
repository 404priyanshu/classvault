create function public.are_note_tags_valid(candidate_tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    candidate_tags is not null
    and cardinality(candidate_tags) <= 10
    and not exists (
      select 1
      from unnest(candidate_tags) as tag(value)
      where tag.value is null
        or tag.value <> lower(trim(tag.value))
        or char_length(tag.value) not between 2 and 32
        or tag.value !~ '^[a-z0-9]+(?:[ -][a-z0-9]+)*$'
    )
    and cardinality(candidate_tags) = (
      select count(distinct tag.value)
      from unnest(candidate_tags) as tag(value)
    );
$$;

revoke all on function public.are_note_tags_valid(text[]) from public;

create table public.subjects (
  id bigint generated always as identity primary key,
  university_id bigint references public.universities (id) on delete restrict,
  course text,
  code text,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_course
    check (course is null or course in ('MCA', 'BCA', 'B.Tech', 'M.Tech')),
  constraint subjects_code_length
    check (code is null or char_length(trim(code)) between 1 and 32),
  constraint subjects_name_length
    check (char_length(trim(name)) between 2 and 120),
  constraint subjects_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index subjects_global_slug_idx
  on public.subjects (slug)
  where university_id is null;

create unique index subjects_university_slug_idx
  on public.subjects (university_id, slug)
  where university_id is not null;

create index subjects_university_active_idx
  on public.subjects (university_id, name, id)
  where is_active;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null
    references public.profiles (id) on delete restrict,
  subject_id bigint references public.subjects (id) on delete restrict,
  visibility text not null default 'public',
  university_id bigint references public.universities (id) on delete restrict,
  title text not null,
  description text,
  note_type text not null default 'other',
  tags text[] not null default '{}',
  publication_status text not null default 'draft',
  moderation_status text not null default 'clear',
  published_at timestamptz,
  deleted_at timestamptz,
  purge_after timestamptz,
  retention_hold boolean not null default false,
  superseded_by_note_id uuid references public.notes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_title_length
    check (char_length(trim(title)) between 3 and 180),
  constraint notes_description_length
    check (description is null or char_length(description) <= 2000),
  constraint notes_visibility
    check (visibility in ('public', 'university')),
  constraint notes_visibility_university
    check (
      (visibility = 'public' and university_id is null)
      or (visibility = 'university' and university_id is not null)
    ),
  constraint notes_note_type
    check (
      note_type in (
        'lecture_notes',
        'summary',
        'pyq',
        'solution',
        'lab',
        'other'
      )
    ),
  constraint notes_tags
    check (public.are_note_tags_valid(tags)),
  constraint notes_publication_status
    check (publication_status in ('draft', 'processing', 'published', 'failed')),
  constraint notes_moderation_status
    check (
      moderation_status in ('clear', 'under_review', 'restricted', 'removed')
    ),
  constraint notes_published_state
    check (
      (publication_status = 'published' and published_at is not null and subject_id is not null)
      or (publication_status <> 'published' and published_at is null)
    ),
  constraint notes_deletion_window
    check (
      (deleted_at is null and purge_after is null)
      or (
        deleted_at is not null
        and purge_after = deleted_at + interval '30 days'
      )
    ),
  constraint notes_not_self_superseded
    check (superseded_by_note_id is null or superseded_by_note_id <> id)
);

create index notes_owner_created_idx
  on public.notes (owner_id, created_at desc, id);

create index notes_subject_id_idx
  on public.notes (subject_id)
  where subject_id is not null;

create index notes_university_id_idx
  on public.notes (university_id)
  where university_id is not null;

create index notes_superseded_by_note_id_idx
  on public.notes (superseded_by_note_id)
  where superseded_by_note_id is not null;

create index notes_public_feed_idx
  on public.notes (published_at desc, id)
  where visibility = 'public'
    and publication_status = 'published'
    and moderation_status in ('clear', 'under_review')
    and deleted_at is null;

create index notes_university_feed_idx
  on public.notes (university_id, published_at desc, id)
  where visibility = 'university'
    and publication_status = 'published'
    and moderation_status in ('clear', 'under_review')
    and deleted_at is null;

create index notes_subject_feed_idx
  on public.notes (subject_id, published_at desc, id)
  where publication_status = 'published'
    and moderation_status in ('clear', 'under_review')
    and deleted_at is null;

create table public.note_assets (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null unique
    references public.notes (id) on delete cascade,
  storage_backend text not null,
  object_key text not null unique,
  original_filename text not null,
  detected_mime_type text not null,
  byte_size bigint not null,
  sha256 text not null,
  processing_status text not null default 'uploading',
  page_count integer,
  preview_object_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint note_assets_storage_backend_length
    check (char_length(trim(storage_backend)) between 2 and 40),
  constraint note_assets_object_key_format
    check (
      object_key ~ '^notes/[0-9a-f-]{36}/source/[0-9a-f-]{36}$'
      and object_key not like '%..%'
    ),
  constraint note_assets_original_filename_length
    check (char_length(trim(original_filename)) between 1 and 255),
  constraint note_assets_mime_type
    check (
      detected_mime_type in (
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
      )
    ),
  constraint note_assets_byte_size
    check (byte_size between 1 and 26214400),
  constraint note_assets_sha256_format
    check (sha256 ~ '^[0-9a-f]{64}$'),
  constraint note_assets_processing_status
    check (
      processing_status in ('uploading', 'scanning', 'ready', 'rejected', 'purged')
    ),
  constraint note_assets_page_count
    check (page_count is null or page_count > 0),
  constraint note_assets_preview_key_length
    check (
      preview_object_key is null
      or char_length(preview_object_key) between 10 and 512
    )
);

create index note_assets_sha256_idx
  on public.note_assets (sha256);

create table public.note_search_documents (
  note_id uuid primary key references public.notes (id) on delete cascade,
  extraction_status text not null default 'pending',
  extracted_text text,
  search_document tsvector,
  extractor_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint note_search_documents_status
    check (extraction_status in ('pending', 'ready', 'failed', 'unsupported')),
  constraint note_search_documents_extractor_version_length
    check (extractor_version is null or char_length(extractor_version) <= 80)
);

create index note_search_documents_search_idx
  on public.note_search_documents using gin (search_document)
  where search_document is not null;

create table public.note_ratings (
  note_id uuid not null references public.notes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (note_id, user_id),
  constraint note_ratings_value check (rating between 1 and 5)
);

create index note_ratings_user_id_idx
  on public.note_ratings (user_id, updated_at desc);

create table public.note_rating_summaries (
  note_id uuid primary key references public.notes (id) on delete cascade,
  rating_count bigint not null default 0,
  average_rating numeric(3, 2),
  effective_rating_count numeric(12, 4) not null default 0,
  weighted_score numeric(6, 4),
  last_rated_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint note_rating_summaries_count
    check (rating_count >= 0),
  constraint note_rating_summaries_average
    check (average_rating is null or average_rating between 1 and 5),
  constraint note_rating_summaries_effective_count
    check (effective_rating_count >= 0),
  constraint note_rating_summaries_weighted_score
    check (weighted_score is null or weighted_score between 1 and 5),
  constraint note_rating_summaries_empty_state
    check (
      (rating_count = 0 and average_rating is null and last_rated_at is null)
      or (rating_count > 0 and average_rating is not null and last_rated_at is not null)
    )
);

create table public.note_reports (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint note_reports_category
    check (
      category in (
        'copyright',
        'unsafe_file',
        'wrong_scope',
        'misleading',
        'harassment',
        'spam',
        'other'
      )
    ),
  constraint note_reports_details_length
    check (details is null or char_length(details) <= 2000),
  constraint note_reports_status
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  constraint note_reports_resolution
    check (
      (status in ('open', 'reviewing') and resolved_at is null)
      or (status in ('resolved', 'dismissed') and resolved_at is not null)
    )
);

create unique index note_reports_one_open_per_reporter_idx
  on public.note_reports (note_id, reporter_id)
  where status in ('open', 'reviewing');

create index note_reports_note_status_idx
  on public.note_reports (note_id, status, created_at);

create index note_reports_reporter_id_idx
  on public.note_reports (reporter_id, created_at desc);

create table public.platform_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles (id) on delete restrict,
  primary key (user_id, role),
  constraint platform_roles_role
    check (role in ('platform_moderator', 'platform_admin')),
  constraint platform_roles_not_self_granted
    check (granted_by is null or granted_by <> user_id)
);

create index platform_roles_granted_by_idx
  on public.platform_roles (granted_by)
  where granted_by is not null;

create table public.note_moderation_actions (
  id bigint generated always as identity primary key,
  note_id uuid not null references public.notes (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action text not null,
  reason_code text not null,
  safe_owner_message text,
  created_at timestamptz not null default now(),
  constraint note_moderation_actions_action
    check (
      action in (
        'start_review',
        'clear_review',
        'restrict',
        'restore',
        'remove',
        'hold',
        'release_hold'
      )
    ),
  constraint note_moderation_actions_reason_length
    check (char_length(trim(reason_code)) between 2 and 80),
  constraint note_moderation_actions_owner_message_length
    check (safe_owner_message is null or char_length(safe_owner_message) <= 1000)
);

create index note_moderation_actions_note_created_idx
  on public.note_moderation_actions (note_id, created_at desc, id);

create index note_moderation_actions_actor_id_idx
  on public.note_moderation_actions (actor_id, created_at desc);

create function public.validate_note_subject_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subject_university_id bigint;
  subject_is_active boolean;
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

  if subject_university_id is not null
    and (
      new.visibility <> 'university'
      or new.university_id is distinct from subject_university_id
    ) then
    raise exception 'University subject does not match note scope'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create function public.enforce_note_immutable_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Note ownership is immutable'
      using errcode = '23514';
  end if;

  if old.publication_status = 'published'
    and (
      new.publication_status <> 'published'
      or new.published_at is distinct from old.published_at
      or new.visibility is distinct from old.visibility
      or new.university_id is distinct from old.university_id
    ) then
    raise exception 'Published note publication state and scope are immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create function public.enforce_published_note_asset_immutability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.note_id is distinct from old.note_id then
    raise exception 'A note asset cannot be moved to another note'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.notes as note
    where note.id = old.note_id
      and note.publication_status = 'published'
  ) and (
    new.object_key is distinct from old.object_key
    or new.detected_mime_type is distinct from old.detected_mime_type
    or new.byte_size is distinct from old.byte_size
    or new.sha256 is distinct from old.sha256
  ) then
    raise exception 'Published note source assets are immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_profile_updated_at();

create trigger notes_validate_subject_scope
before insert or update of subject_id, visibility, university_id, publication_status
on public.notes
for each row execute function public.validate_note_subject_scope();

create trigger notes_enforce_immutable_fields
before update on public.notes
for each row execute function public.enforce_note_immutable_fields();

create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_profile_updated_at();

create trigger note_assets_enforce_source_immutability
before update on public.note_assets
for each row execute function public.enforce_published_note_asset_immutability();

create trigger note_assets_set_updated_at
before update on public.note_assets
for each row execute function public.set_profile_updated_at();

create trigger note_search_documents_set_updated_at
before update on public.note_search_documents
for each row execute function public.set_profile_updated_at();

create trigger note_ratings_set_updated_at
before update on public.note_ratings
for each row execute function public.set_profile_updated_at();

create trigger note_rating_summaries_set_updated_at
before update on public.note_rating_summaries
for each row execute function public.set_profile_updated_at();

create function public.is_notes_eligible()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.onboarding_completed_at is not null
  );
$$;

create function public.has_verified_university_membership(target_university_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.university_memberships as membership
    where membership.user_id = (select auth.uid())
      and membership.university_id = target_university_id
      and membership.status = 'verified'
  );
$$;

create function public.has_platform_notes_role(accepted_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_roles as assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role = any(accepted_roles)
  );
$$;

create function public.can_moderate_note(target_note_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.notes as note
    where note.id = target_note_id
      and (
        note.moderation_status <> 'clear'
        or note.retention_hold
        or exists (
          select 1
          from public.note_reports as report
          where report.note_id = note.id
            and report.status in ('open', 'reviewing')
        )
      )
      and (
        public.has_platform_notes_role(
          array['platform_moderator', 'platform_admin']::text[]
        )
        or (
          note.visibility = 'university'
          and exists (
            select 1
            from public.university_memberships as membership
            where membership.user_id = (select auth.uid())
              and membership.university_id = note.university_id
              and membership.status = 'verified'
              and membership.role in ('moderator', 'admin')
          )
        )
      )
  );
$$;

create function public.can_view_note_metadata(target_note_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.notes as note
    where note.id = target_note_id
      and (
        note.owner_id = (select auth.uid())
        or public.can_moderate_note(note.id)
        or (
          public.is_notes_eligible()
          and note.publication_status = 'published'
          and note.deleted_at is null
          and note.moderation_status in ('clear', 'under_review')
          and (
            note.visibility = 'public'
            or (
              note.visibility = 'university'
              and public.has_verified_university_membership(note.university_id)
            )
          )
        )
      )
  );
$$;

create function public.can_consume_note(target_note_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.notes as note
    where note.id = target_note_id
      and note.publication_status = 'published'
      and note.deleted_at is null
      and note.moderation_status in ('clear', 'under_review')
      and public.is_notes_eligible()
      and (
        note.owner_id = (select auth.uid())
        or note.visibility = 'public'
        or (
          note.visibility = 'university'
          and public.has_verified_university_membership(note.university_id)
        )
      )
  );
$$;

revoke all on function public.validate_note_subject_scope() from public;
revoke all on function public.enforce_note_immutable_fields() from public;
revoke all on function public.enforce_published_note_asset_immutability() from public;
revoke all on function public.is_notes_eligible() from public;
revoke all on function public.has_verified_university_membership(bigint) from public;
revoke all on function public.has_platform_notes_role(text[]) from public;
revoke all on function public.can_moderate_note(uuid) from public;
revoke all on function public.can_view_note_metadata(uuid) from public;
revoke all on function public.can_consume_note(uuid) from public;

grant execute on function public.is_notes_eligible() to authenticated;
grant execute on function public.has_verified_university_membership(bigint) to authenticated;
grant execute on function public.has_platform_notes_role(text[]) to authenticated;
grant execute on function public.can_moderate_note(uuid) to authenticated;
grant execute on function public.can_view_note_metadata(uuid) to authenticated;
grant execute on function public.can_consume_note(uuid) to authenticated;

alter table public.subjects enable row level security;
alter table public.subjects force row level security;
alter table public.notes enable row level security;
alter table public.notes force row level security;
alter table public.note_assets enable row level security;
alter table public.note_assets force row level security;
alter table public.note_search_documents enable row level security;
alter table public.note_search_documents force row level security;
alter table public.note_ratings enable row level security;
alter table public.note_ratings force row level security;
alter table public.note_rating_summaries enable row level security;
alter table public.note_rating_summaries force row level security;
alter table public.note_reports enable row level security;
alter table public.note_reports force row level security;
alter table public.platform_roles enable row level security;
alter table public.platform_roles force row level security;
alter table public.note_moderation_actions enable row level security;
alter table public.note_moderation_actions force row level security;

revoke all on table public.subjects from anon, authenticated;
revoke all on table public.notes from anon, authenticated;
revoke all on table public.note_assets from anon, authenticated;
revoke all on table public.note_search_documents from anon, authenticated;
revoke all on table public.note_ratings from anon, authenticated;
revoke all on table public.note_rating_summaries from anon, authenticated;
revoke all on table public.note_reports from anon, authenticated;
revoke all on table public.platform_roles from anon, authenticated;
revoke all on table public.note_moderation_actions from anon, authenticated;

grant select on table public.subjects to authenticated;
grant select on table public.notes to authenticated;
grant select on table public.note_ratings to authenticated;
grant select on table public.note_rating_summaries to authenticated;
grant select on table public.note_reports to authenticated;
grant select on table public.note_moderation_actions to authenticated;

create policy "subjects_select_authorized"
  on public.subjects
  for select
  to authenticated
  using (
    (
      is_active
      and (select public.is_notes_eligible())
      and (
        university_id is null
        or (select public.has_verified_university_membership(university_id))
      )
    )
    or (
      (select public.has_platform_notes_role(
        array['platform_moderator', 'platform_admin']::text[]
      ))
    )
    or exists (
      select 1
      from public.notes as visible_note
      where visible_note.subject_id = subjects.id
        and (select public.can_view_note_metadata(visible_note.id))
    )
  );

create policy "notes_select_authorized"
  on public.notes
  for select
  to authenticated
  using ((select public.can_view_note_metadata(id)));

create policy "note_ratings_select_own_authorized"
  on public.note_ratings
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select public.can_consume_note(note_id))
  );

create policy "note_rating_summaries_select_authorized"
  on public.note_rating_summaries
  for select
  to authenticated
  using ((select public.can_consume_note(note_id)));

create policy "note_reports_select_authorized"
  on public.note_reports
  for select
  to authenticated
  using (
    reporter_id = (select auth.uid())
    or (select public.can_moderate_note(note_id))
  );

create policy "note_moderation_actions_select_authorized"
  on public.note_moderation_actions
  for select
  to authenticated
  using ((select public.can_moderate_note(note_id)));

insert into public.subjects (slug, name)
values
  ('data-structures', 'Data Structures'),
  ('database-management-systems', 'Database Management Systems'),
  ('operating-systems', 'Operating Systems'),
  ('computer-networks', 'Computer Networks'),
  ('software-engineering', 'Software Engineering'),
  ('mathematics', 'Mathematics'),
  ('physics', 'Physics'),
  ('thermodynamics', 'Thermodynamics'),
  ('microeconomics', 'Microeconomics')
on conflict do nothing;

comment on table public.subjects is
  'Curated global or university-scoped subjects used by ClassVault notes.';

comment on table public.notes is
  'Authoritative note metadata and lifecycle state; files remain private.';

comment on table public.note_assets is
  'Server-only private storage metadata for one source asset per MVP note.';

comment on table public.note_search_documents is
  'Server-only derived text and search vectors; extracted text is untrusted.';

comment on table public.note_ratings is
  'One private 1-5 rating per eligible non-owner reader and note.';

comment on table public.note_rating_summaries is
  'Server-maintained aggregate and recency-weighted ranking data.';

comment on table public.note_reports is
  'Private student reports visible only to their reporter and scoped moderators.';

comment on table public.platform_roles is
  'Server-owned platform moderator and administrator assignments.';

comment on table public.note_moderation_actions is
  'Append-only audit history for scoped note moderation actions.';

comment on policy "notes_select_authorized" on public.notes is
  'Owners see their metadata; eligible readers see published public or verified-campus notes; scoped moderators see assigned content.';
