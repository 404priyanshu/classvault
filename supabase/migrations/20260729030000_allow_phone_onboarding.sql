alter table public.university_memberships
  alter column academic_email drop not null;

comment on column public.university_memberships.academic_email is
  'Confirmed account email used for campus verification; null for phone-only accounts.';

create or replace function public.complete_student_onboarding(
  p_display_name text,
  p_course text,
  p_graduation_year smallint,
  p_university_id bigint,
  p_primary_goal text,
  p_study_preference text
)
returns table (
  membership_status text,
  selected_university_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_email text;
  current_email_confirmed_at timestamptz;
  email_domain text;
  resolved_membership_status text;
  resolved_university_name text;
begin
  current_user_id := (select auth.uid());

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if p_display_name is null
    or char_length(trim(p_display_name)) not between 2 and 80 then
    raise exception 'Display name must contain between 2 and 80 characters'
      using errcode = '22023';
  end if;

  if p_course is null or char_length(trim(p_course)) not between 2 and 120 then
    raise exception 'Course must contain between 2 and 120 characters'
      using errcode = '22023';
  end if;

  if p_graduation_year not between 2000 and 2100 then
    raise exception 'Graduation year is outside the accepted range'
      using errcode = '22023';
  end if;

  if p_primary_goal not in (
    'ace_exams',
    'stay_consistent',
    'master_subjects',
    'placement_prep'
  ) then
    raise exception 'Unknown primary goal'
      using errcode = '22023';
  end if;

  if p_study_preference not in ('solo', 'accountability', 'study_group') then
    raise exception 'Unknown study preference'
      using errcode = '22023';
  end if;

  select university.name
  into resolved_university_name
  from public.universities as university
  where university.id = p_university_id
    and university.is_active;

  if resolved_university_name is null then
    raise exception 'University is unavailable'
      using errcode = '22023';
  end if;

  select auth_user.email, auth_user.email_confirmed_at
  into current_email, current_email_confirmed_at
  from auth.users as auth_user
  where auth_user.id = current_user_id;

  if current_email is not null then
    email_domain := lower(split_part(current_email, '@', 2));
  end if;

  if current_email is not null
    and current_email_confirmed_at is not null
    and exists (
      select 1
      from public.university_email_domains as trusted_domain
      where trusted_domain.university_id = p_university_id
        and (
          email_domain = trusted_domain.domain
          or email_domain like ('%.' || trusted_domain.domain)
        )
    ) then
    resolved_membership_status := 'verified';
  else
    resolved_membership_status := 'pending';
  end if;

  insert into public.profiles (
    id,
    display_name,
    university_name,
    course,
    graduation_year,
    primary_goal,
    study_preference,
    onboarding_completed_at
  )
  values (
    current_user_id,
    trim(p_display_name),
    resolved_university_name,
    trim(p_course),
    p_graduation_year,
    p_primary_goal,
    p_study_preference,
    now()
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    university_name = excluded.university_name,
    course = excluded.course,
    graduation_year = excluded.graduation_year,
    primary_goal = excluded.primary_goal,
    study_preference = excluded.study_preference,
    onboarding_completed_at = excluded.onboarding_completed_at;

  insert into public.university_memberships (
    user_id,
    university_id,
    academic_email,
    status,
    verified_at
  )
  values (
    current_user_id,
    p_university_id,
    lower(current_email),
    resolved_membership_status,
    case
      when resolved_membership_status = 'verified' then now()
      else null
    end
  )
  on conflict (user_id) do update
  set
    university_id = excluded.university_id,
    academic_email = excluded.academic_email,
    status = excluded.status,
    verified_at = excluded.verified_at;

  return query
  select resolved_membership_status, resolved_university_name;
end;
$$;
