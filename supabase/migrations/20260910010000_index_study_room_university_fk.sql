-- Index the university foreign key on study_rooms.

-- `study_rooms.university_id` references `universities (id) on delete restrict`,
-- and Postgres does not index a referencing column for you. Every delete or key
-- update on a university therefore sequentially scans study_rooms to prove no
-- room still points at it, and holds a lock while it does.
--
-- The existing `study_rooms_access_created_idx` covers the same column but only
-- as its second term, behind `visibility`, so the foreign key check cannot use
-- it without knowing the visibility first.
--
-- Partial, matching `notes_university_id_idx`: a public room is required to
-- leave university_id null by `study_rooms_university_scope`, and those rows can
-- never satisfy the check, so indexing them would only cost writes.

create index study_rooms_university_id_idx
  on public.study_rooms (university_id)
  where university_id is not null;
