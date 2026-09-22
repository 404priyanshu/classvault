-- Make service_role's table access explicit instead of inherited.

-- The production project was created in August 2026, when a new Supabase project
-- shipped `alter default privileges in schema public grant all on tables to
-- anon, authenticated, service_role`. Every table these migrations created
-- therefore picked up `service_role=arwdDxtm` for free, and nothing in this
-- repository ever had to grant it. The notes foundation revokes anon and
-- authenticated explicitly, so that inheritance was invisible.
--
-- Current Supabase images ship the tightened default: new tables in public grant
-- the API roles only `Dxtm` — truncate, references, trigger, maintain — and no
-- select, insert, update or delete. Replaying these migrations onto a local
-- stack or a freshly created project therefore produces a schema where
-- service_role cannot read the tables its workers exist to drive: roadmap
-- generation cannot claim a roadmap, and search extraction cannot read
-- note_search_documents. The pgTAP suites catch it as `permission denied for
-- table study_roadmaps`.
--
-- This restates production's grants as schema, so the database can be rebuilt
-- anywhere and match. On production it changes nothing; the grants are already
-- there.
--
-- service_role is the server-only key held by the scheduled workers and roadmap
-- generation. It is never exposed to a browser, and it bypasses RLS regardless,
-- so these grants widen nothing relative to what production already allows.
-- Narrowing service_role to only the tables the workers touch is worth doing,
-- but it is a deliberate change to production behaviour and does not belong in a
-- migration whose purpose is to make the two environments agree.

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;

-- Deliberately not touching anon or authenticated here. `revoke all ... from
-- anon` would read as a tidy companion to the above and would break onboarding:
-- production grants anon select on universities and university_email_domains, and
-- the signed-out university typeahead depends on it. The client roles are granted
-- and revoked table by table in the migrations that own those tables, which is
-- where any change to them belongs.
