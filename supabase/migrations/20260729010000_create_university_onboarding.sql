create table public.universities (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  short_name text,
  city text,
  state text,
  country text not null default 'India',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint universities_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint universities_name_length
    check (char_length(name) between 2 and 160),
  constraint universities_short_name_length
    check (short_name is null or char_length(short_name) between 2 and 32),
  constraint universities_city_length
    check (city is null or char_length(city) <= 80),
  constraint universities_state_length
    check (state is null or char_length(state) <= 80)
);

create table public.university_email_domains (
  id bigint generated always as identity primary key,
  university_id bigint not null
    references public.universities (id) on delete cascade,
  domain text not null,
  created_at timestamptz not null default now(),
  constraint university_email_domains_format
    check (
      domain = lower(domain)
      and domain ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$'
    )
);

create unique index university_email_domains_domain_idx
  on public.university_email_domains (lower(domain));

create index university_email_domains_university_id_idx
  on public.university_email_domains (university_id);

create table public.university_memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  university_id bigint not null
    references public.universities (id) on delete restrict,
  academic_email text not null,
  status text not null default 'pending',
  role text not null default 'student',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  constraint university_memberships_email_length
    check (char_length(academic_email) between 3 and 254),
  constraint university_memberships_status
    check (status in ('pending', 'verified', 'rejected')),
  constraint university_memberships_role
    check (role in ('student', 'moderator', 'admin')),
  constraint university_memberships_verified_at
    check (
      (status = 'verified' and verified_at is not null)
      or (status <> 'verified' and verified_at is null)
    )
);

create index university_memberships_university_id_idx
  on public.university_memberships (university_id);

alter table public.profiles
  add column primary_goal text,
  add column study_preference text,
  add column onboarding_completed_at timestamptz,
  add constraint profiles_primary_goal
    check (
      primary_goal is null
      or primary_goal in (
        'ace_exams',
        'stay_consistent',
        'master_subjects',
        'placement_prep'
      )
    ),
  add constraint profiles_study_preference
    check (
      study_preference is null
      or study_preference in ('solo', 'accountability', 'study_group')
    );

comment on table public.universities is
  'Curated institutions available during ClassVault onboarding.';

comment on table public.university_email_domains is
  'Trusted root domains used to verify confirmed Supabase Auth emails.';

comment on table public.university_memberships is
  'One university membership per student; verification is assigned only by database code.';

alter table public.universities enable row level security;
alter table public.universities force row level security;
alter table public.university_email_domains enable row level security;
alter table public.university_email_domains force row level security;
alter table public.university_memberships enable row level security;
alter table public.university_memberships force row level security;

revoke all on table public.universities from anon;
revoke all on table public.university_email_domains from anon;
revoke all on table public.university_memberships from anon;

grant select on table public.universities to authenticated;
grant select on table public.university_email_domains to authenticated;
grant select on table public.university_memberships to authenticated;
grant update (primary_goal, study_preference) on table public.profiles
  to authenticated;

create policy "universities_select_active"
  on public.universities
  for select
  to authenticated
  using (is_active);

create policy "university_domains_select"
  on public.university_email_domains
  for select
  to authenticated
  using (true);

create policy "university_memberships_select_own"
  on public.university_memberships
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger university_memberships_set_updated_at
before update on public.university_memberships
for each row
execute function public.set_profile_updated_at();

insert into public.universities (
  slug,
  name,
  short_name,
  city,
  state
)
values
  ('bennett-university', 'Bennett University', 'Bennett', 'Greater Noida', 'Uttar Pradesh'),
  ('iit-bombay', 'Indian Institute of Technology Bombay', 'IIT Bombay', 'Mumbai', 'Maharashtra'),
  ('iit-delhi', 'Indian Institute of Technology Delhi', 'IIT Delhi', 'New Delhi', 'Delhi'),
  ('iit-madras', 'Indian Institute of Technology Madras', 'IIT Madras', 'Chennai', 'Tamil Nadu'),
  ('iit-kanpur', 'Indian Institute of Technology Kanpur', 'IIT Kanpur', 'Kanpur', 'Uttar Pradesh'),
  ('nitk-surathkal', 'National Institute of Technology Karnataka, Surathkal', 'NITK', 'Mangaluru', 'Karnataka'),
  ('university-of-delhi', 'University of Delhi', 'DU', 'New Delhi', 'Delhi'),
  ('jawaharlal-nehru-university', 'Jawaharlal Nehru University', 'JNU', 'New Delhi', 'Delhi'),
  ('banaras-hindu-university', 'Banaras Hindu University', 'BHU', 'Varanasi', 'Uttar Pradesh'),
  ('jadavpur-university', 'Jadavpur University', 'JU', 'Kolkata', 'West Bengal'),
  ('bits-pilani', 'Birla Institute of Technology and Science, Pilani', 'BITS Pilani', 'Pilani', 'Rajasthan'),
  ('vit-vellore', 'Vellore Institute of Technology', 'VIT', 'Vellore', 'Tamil Nadu'),
  ('manipal-academy', 'Manipal Academy of Higher Education', 'MAHE', 'Manipal', 'Karnataka');

insert into public.university_email_domains (university_id, domain)
select university.id, domains.domain
from (
  values
    ('bennett-university', 'bennett.edu.in'),
    ('iit-bombay', 'iitb.ac.in'),
    ('iit-delhi', 'iitd.ac.in'),
    ('iit-madras', 'iitm.ac.in'),
    ('iit-kanpur', 'iitk.ac.in'),
    ('nitk-surathkal', 'nitk.ac.in'),
    ('nitk-surathkal', 'nitk.edu.in'),
    ('university-of-delhi', 'du.ac.in'),
    ('jawaharlal-nehru-university', 'jnu.ac.in'),
    ('banaras-hindu-university', 'bhu.ac.in'),
    ('jadavpur-university', 'jaduniv.edu.in'),
    ('bits-pilani', 'bits-pilani.ac.in'),
    ('vit-vellore', 'vit.ac.in'),
    ('manipal-academy', 'manipal.edu')
) as domains(university_slug, domain)
join public.universities as university
  on university.slug = domains.university_slug;

create function public.complete_student_onboarding(
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

  if current_email is null then
    raise exception 'A confirmed email is required'
      using errcode = '22023';
  end if;

  email_domain := lower(split_part(current_email, '@', 2));

  if current_email_confirmed_at is not null
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

revoke all on function public.complete_student_onboarding(
  text,
  text,
  smallint,
  bigint,
  text,
  text
) from public;

grant execute on function public.complete_student_onboarding(
  text,
  text,
  smallint,
  bigint,
  text,
  text
) to authenticated;
