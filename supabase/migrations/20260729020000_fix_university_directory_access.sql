revoke all on table public.universities from anon, authenticated;
revoke all on table public.university_email_domains from anon, authenticated;

grant select on table public.universities to anon, authenticated;
grant select on table public.university_email_domains to anon, authenticated;

drop policy if exists "universities_select_active" on public.universities;
create policy "universities_select_active"
  on public.universities
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists "university_domains_select"
  on public.university_email_domains;
create policy "university_domains_select"
  on public.university_email_domains
  for select
  to anon, authenticated
  using (true);

comment on policy "universities_select_active" on public.universities is
  'The active university directory is public reference data used during onboarding.';

comment on policy "university_domains_select" on public.university_email_domains is
  'Academic email domains are public reference data; verification remains server-owned.';
