-- Rating mutation and deterministic recency-weighted ranking.
--
-- Implements the spec contract from
-- docs/notes-product-data-permissions-spec.md section 10:
--   rating_weight(age_days) = 0.5 ^ (age_days / 365)
--   effective_count         = sum(rating_weight)
--   weighted_score          = (sum(rating * weight) + prior_strength * cohort_mean)
--                             / (effective_count + prior_strength)
-- with a 365-day half-life, prior strength 8, and default cohort mean 3.5.
--
-- Clients never write ratings or summaries directly: rate_note rechecks read
-- access, rejects self-ratings, upserts one 1-5 rating per student, and the
-- private refresh function maintains the summary row server-side.

create or replace function public.refresh_note_rating_summary(p_note_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cohort_mean numeric;
  v_effective_count numeric;
  v_last_rated_at timestamptz;
  v_rating_count bigint;
  v_rating_sum bigint;
  v_target public.notes%rowtype;
  v_weighted_average numeric;
  v_weighted_sum numeric;
begin
  select note.*
  into v_target
  from public.notes as note
  where note.id = p_note_id;

  if not found then
    raise exception 'Note not found'
      using errcode = 'P0002';
  end if;

  -- Cohort mean: raw ratings from published, visible notes in the same
  -- subject. Public notes compare against public notes; campus notes against
  -- the same university. Reading raw ratings (not summaries) keeps the
  -- result independent of refresh order, so recalculation stays
  -- deterministic. A cohort without ratings falls back to 3.5.
  select avg(peer_rating.rating)
  into v_cohort_mean
  from public.notes as peer
  join public.note_ratings as peer_rating
    on peer_rating.note_id = peer.id
  where peer.id <> v_target.id
    and peer.subject_id = v_target.subject_id
    and peer.publication_status = 'published'
    and peer.deleted_at is null
    and peer.moderation_status in ('clear', 'under_review')
    and (
      v_target.visibility = 'public'
        and peer.visibility = 'public'
      or (
        v_target.visibility = 'university'
          and peer.university_id = v_target.university_id
      )
    );

  if v_cohort_mean is null then
    v_cohort_mean := 3.5;
  end if;

  select
    count(rating.rating),
    sum(rating.rating),
    sum(
      rating.rating::numeric
      * power(
        0.5,
        greatest(
          extract(epoch from (now() - rating.updated_at)) / 86400.0,
          0.0
        ) / 365.0
      )
    ),
    sum(
      power(
        0.5,
        greatest(
          extract(epoch from (now() - rating.updated_at)) / 86400.0,
          0.0
        ) / 365.0
      )
    ),
    max(rating.updated_at)
  into
    v_rating_count,
    v_rating_sum,
    v_weighted_sum,
    v_effective_count,
    v_last_rated_at
  from public.note_ratings as rating
  where rating.note_id = v_target.id;

  v_weighted_average := case
    when v_effective_count is null or v_effective_count <= 0 then
      v_cohort_mean
    else
      (v_weighted_sum + 8.0 * v_cohort_mean)
        / (v_effective_count + 8.0)
  end;

  insert into public.note_rating_summaries (
    note_id,
    rating_count,
    average_rating,
    effective_rating_count,
    weighted_score,
    last_rated_at
  )
  values (
    v_target.id,
    coalesce(v_rating_count, 0),
    case
      when coalesce(v_rating_count, 0) > 0
        then round(v_rating_sum::numeric / v_rating_count, 2)::numeric(3, 2)
      else null
    end,
    round(coalesce(v_effective_count, 0), 4),
    round(v_weighted_average, 4),
    case
      when coalesce(v_rating_count, 0) > 0 then v_last_rated_at
      else null
    end
  )
  on conflict (note_id) do update
  set
    rating_count = excluded.rating_count,
    average_rating = excluded.average_rating,
    effective_rating_count = excluded.effective_rating_count,
    weighted_score = excluded.weighted_score,
    last_rated_at = excluded.last_rated_at,
    updated_at = now();
end;
$$;

create or replace function public.rate_note(
  p_note_id uuid,
  p_rating smallint
)
returns table (
  success boolean,
  error_code text,
  rating_count bigint,
  average_rating numeric,
  effective_rating_count numeric,
  weighted_score numeric
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
    success := false;
    error_code := 'unauthenticated';
    return next;
    return;
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    success := false;
    error_code := 'invalid_rating';
    return next;
    return;
  end if;

  select note.*
  into note_record
  from public.notes as note
  where note.id = p_note_id
    and note.publication_status = 'published'
    and note.deleted_at is null
    and note.moderation_status in ('clear', 'under_review');

  if not found then
    success := false;
    error_code := 'note_unavailable';
    return next;
    return;
  end if;

  if note_record.owner_id = actor_id then
    success := false;
    error_code := 'self_rating_forbidden';
    return next;
    return;
  end if;

  if not public.can_consume_note(note_record.id) then
    success := false;
    error_code := 'not_permitted';
    return next;
    return;
  end if;

  insert into public.note_ratings (note_id, user_id, rating)
  values (note_record.id, actor_id, p_rating)
  on conflict (note_id, user_id) do update
    set rating = excluded.rating,
      updated_at = now();

  perform public.refresh_note_rating_summary(note_record.id);

  select summary.rating_count,
    summary.average_rating,
    summary.effective_rating_count,
    summary.weighted_score
  into rating_count,
    average_rating,
    effective_rating_count,
    weighted_score
  from public.note_rating_summaries as summary
  where summary.note_id = note_record.id;

  success := true;
  error_code := null;
  return next;
end;
$$;

-- Server-owned library listing: applies access before ranking, filtering,
-- counts, and pagination (spec operation list_notes). Ordering is fully
-- deterministic; every sort ends in a unique id tiebreaker.
create or replace function public.list_notes_for_library(
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
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with accessible_notes as (
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
      count(*) over () as total_count
    from public.notes as note
    join public.subjects as subject on subject.id = note.subject_id
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
        p_query is null
        or p_query = ''
        or note.title ilike '%' || p_query || '%'
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
    accessible_notes.total_count
  from accessible_notes
  order by
    case
      when p_sort = 'oldest' then accessible_notes.sort_published_at
    end asc,
    case
      when p_sort = 'oldest' then accessible_notes.id
    end asc,
    case
      when p_sort = 'top' then accessible_notes.weighted_score
    end desc nulls last,
    case
      when p_sort = 'top' then accessible_notes.rating_count
    end desc nulls last,
    case
      when p_sort = 'top' then accessible_notes.sort_published_at
    end desc,
    case
      when p_sort = 'top' then accessible_notes.id
    end desc,
    case
      when p_sort = 'oldest' then null
      else accessible_notes.sort_published_at
    end desc,
    case
      when p_sort = 'oldest' then null
      else accessible_notes.id
    end desc
  limit greatest(least(coalesce(p_limit, 10), 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.refresh_note_rating_summary(uuid)
  from public;
revoke all on function public.rate_note(uuid, smallint) from public;
revoke all on function public.list_notes_for_library(text, bigint, text, text, text, integer, integer)
  from public;

revoke all on function public.refresh_note_rating_summary(uuid)
  from anon, authenticated;
revoke all on function public.rate_note(uuid, smallint)
  from anon, authenticated;
revoke all on function public.list_notes_for_library(text, bigint, text, text, text, integer, integer)
  from anon, authenticated;

grant execute on function public.rate_note(uuid, smallint) to authenticated;
grant execute on function public.list_notes_for_library(text, bigint, text, text, text, integer, integer)
  to authenticated;
