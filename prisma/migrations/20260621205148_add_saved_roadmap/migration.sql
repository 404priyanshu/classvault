-- CreateTable
CREATE TABLE "SavedRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "contextNoteCount" INTEGER NOT NULL DEFAULT 0,
    "plan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedRoadmap_userId_updatedAt_idx" ON "SavedRoadmap"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "SavedRoadmap" ADD CONSTRAINT "SavedRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
