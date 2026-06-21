-- Trigram fuzzy search. pg_trgm powers typo-tolerant / partial matching that
-- the English tsvector cannot do (e.g. "dbm" -> "dbms", "operatng systm" ->
-- "operating systems", and course codes like "CS302"). GIN trigram indexes on
-- the short, identifier-like fields where stemming-based FTS falls short.
--
-- These indexes are raw-only (not expressible in schema.prisma), matching how
-- the existing Note_searchVector GIN index is kept out of the schema.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Note_title_trgm_idx" ON "Note" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Note_subject_trgm_idx" ON "Note" USING GIN ("subject" gin_trgm_ops);
CREATE INDEX "Note_courseCode_trgm_idx" ON "Note" USING GIN ("courseCode" gin_trgm_ops);
