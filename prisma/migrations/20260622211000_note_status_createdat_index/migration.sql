-- CreateIndex
-- Composite b-tree serving the default list (status filter + createdAt sort)
-- and its keyset cursor in a single index scan.
CREATE INDEX "Note_status_createdAt_idx" ON "Note"("status", "createdAt");
