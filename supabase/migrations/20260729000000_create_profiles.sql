create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  university_name text,
  course text,
  graduation_year smallint,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) between 2 and 80),
  constraint profiles_university_name_length
    check (university_name is null or char_length(university_name) <= 160),
  constraint profiles_course_length
    check (course is null or char_length(course) <= 120),
  constraint profiles_graduation_year_range
    check (graduation_year is null or graduation_year between 2000 and 2100),
  constraint profiles_avatar_url_length
    check (avatar_url is null or char_length(avatar_url) <= 2048)
);

comment on table public.profiles is
  'Private application profiles paired one-to-one with Supabase Auth users.';

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

revoke all on table public.profiles from anon;
grant select on table public.profiles to authenticated;
grant update (
  display_name,
  university_name,
  course,
  graduation_year,
  avatar_url
) on table public.profiles to authenticated;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := nullif(
    left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80),
    ''
  );

  insert into public.profiles (id, display_name)
  values (new.id, requested_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

revoke all on function public.set_profile_updated_at() from public;
revoke all on function public.handle_new_auth_user() from public;
