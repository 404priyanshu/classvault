-- Scope the launch to a single campus.
--
-- ClassVault opens at Bennett University only. Note ratings are the product's
-- trust signal, and a rating is meaningless until many classmates in the same
-- subject and semester have supplied one. Spreading the first cohort across
-- thirteen universities guarantees that no single one reaches that density.
--
-- The directory stays seeded. Deactivation is reversible: set is_active back to
-- true for a university once its cohort is ready to onboard. The existing
-- "universities_select_active" policy already restricts the readable directory
-- to active rows, so onboarding needs no application change.

update public.universities
set is_active = false
where slug <> 'bennett-university';

-- Fail loudly if the launch campus is missing or was itself deactivated. A
-- silently empty directory would surface to students as a broken onboarding
-- step rather than as a migration error.
do $$
declare
  active_count integer;
begin
  select count(*) into active_count
  from public.universities
  where is_active;

  if active_count <> 1 then
    raise exception
      'Expected exactly one active university for the Bennett launch, found %.',
      active_count;
  end if;
end;
$$;
