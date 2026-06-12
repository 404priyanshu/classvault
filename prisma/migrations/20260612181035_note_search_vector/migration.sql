-- Full-text search vector over the note's text fields. Generated column so it
-- stays in sync with writes without application code; GIN index for fast
-- websearch_to_tsquery matches.
ALTER TABLE "Note" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce("title", '') || ' ' ||
      coalesce("description", '') || ' ' ||
      coalesce("topic", '') || ' ' ||
      coalesce("subject", '')
    )
  ) STORED;

CREATE INDEX "Note_searchVector_idx" ON "Note" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "DownloadEvent_noteId_createdAt_idx" ON "DownloadEvent"("noteId", "createdAt");
