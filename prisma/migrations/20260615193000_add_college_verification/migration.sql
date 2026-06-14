ALTER TABLE "User"
  ADD COLUMN "collegeName" TEXT,
  ADD COLUMN "collegeEmail" TEXT,
  ADD COLUMN "collegeVerifiedAt" TIMESTAMP(3);

CREATE TABLE "CollegeVerificationCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "collegeName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CollegeVerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CollegeVerificationCode_userId_idx" ON "CollegeVerificationCode"("userId");
CREATE INDEX "CollegeVerificationCode_email_idx" ON "CollegeVerificationCode"("email");
CREATE INDEX "CollegeVerificationCode_expiresAt_idx" ON "CollegeVerificationCode"("expiresAt");

ALTER TABLE "CollegeVerificationCode"
  ADD CONSTRAINT "CollegeVerificationCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
