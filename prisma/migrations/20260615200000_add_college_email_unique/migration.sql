-- One ClassVault account per verified college email.
-- Nullable column: Postgres treats NULLs as distinct, so unverified users
-- (collegeEmail IS NULL) are unaffected.
CREATE UNIQUE INDEX "User_collegeEmail_key" ON "User"("collegeEmail");
