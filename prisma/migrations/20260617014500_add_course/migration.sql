-- First-class course entity for note grouping and future course pages.
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "subject" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

ALTER TABLE "Note" ADD COLUMN "courseId" TEXT;

INSERT INTO "Course" ("id", "code", "subject", "createdAt", "updatedAt")
SELECT
    'course_' || md5("courseCode"),
    "courseCode",
    MIN("subject"),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Note"
GROUP BY "courseCode"
ON CONFLICT ("code") DO NOTHING;

UPDATE "Note"
SET "courseId" = "Course"."id"
FROM "Course"
WHERE "Note"."courseId" IS NULL
    AND "Course"."code" = "Note"."courseCode";

CREATE INDEX "Note_courseId_idx" ON "Note"("courseId");

ALTER TABLE "Note" ADD CONSTRAINT "Note_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
