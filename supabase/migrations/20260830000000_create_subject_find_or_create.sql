-- Let students name a subject the catalog does not have yet.
--
-- The seeded catalog holds nine global subjects and no campus courses, so a
-- Bennett student uploading "Blockchain Engineering" either mislabels the note
-- or cannot publish it at all. ADR-0014 chose free-form subjects over official
-- course catalogs; this restores that intent without dropping the foreign key
-- that ranking, search, and roadmap selection already rely on.
--
-- New subjects are created against the caller's university so one campus cannot
-- pollute another's catalog, and never as global rows. Matching is by slug, so
-- casing and inner whitespace collapse onto one row.

create function public.normalize_subject_slug(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g')
  );
$$;

comment on function public.normalize_subject_slug(text) is
  'Collapses a free-form subject name to its match key so casing and spacing do not create duplicate rows.';

create function public.find_or_create_subject(p_name text)
returns table (id bigint, name text, code text, university_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  cleaned text := trim(coalesce(p_name, ''));
  target_slug text;
  actor_university bigint;
  found_id bigint;
begin
  if actor is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  if char_length(cleaned) < 2 or char_length(cleaned) > 120 then
    raise exception 'invalid_subject_name' using errcode = '23514';
  end if;

  target_slug := public.normalize_subject_slug(cleaned);

  if char_length(target_slug) < 2 then
    raise exception 'invalid_subject_name' using errcode = '23514';
  end if;

  -- Only a completed profile may extend the catalog. This keeps a drive-by
  -- account from seeding junk subjects before it has done anything else.
  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = actor
      and profile.onboarding_completed_at is not null
  ) then
    raise exception 'onboarding_incomplete' using errcode = '42501';
  end if;

  select membership.university_id
  into actor_university
  from public.university_memberships as membership
  where membership.user_id = actor;

  -- Prefer a global subject, then one already owned by the caller's campus, so
  -- a shared name never forks into a second campus-local row.
  select subject.id
  into found_id
  from public.subjects as subject
  where subject.slug = target_slug
    and subject.is_active
    and (
      subject.university_id is null
      or subject.university_id is not distinct from actor_university
    )
  order by subject.university_id nulls first
  limit 1;

  if found_id is null then
    if actor_university is null then
      raise exception 'university_required' using errcode = '42501';
    end if;

    insert into public.subjects (name, slug, university_id)
    values (cleaned, target_slug, actor_university)
    returning subjects.id into found_id;
  end if;

  return query
  select subject.id, subject.name, subject.code, subject.university_id
  from public.subjects as subject
  where subject.id = found_id;
end;
$$;

comment on function public.find_or_create_subject(text) is
  'Returns the subject matching a free-form name, creating it against the caller''s university when the catalog does not have it yet.';

revoke all on function public.normalize_subject_slug(text)
  from public, anon, authenticated;
revoke all on function public.find_or_create_subject(text)
  from public, anon, authenticated;
grant execute on function public.find_or_create_subject(text) to authenticated;
