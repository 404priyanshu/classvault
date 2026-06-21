import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  AiProviderName,
  ApiRoadmapDay,
  ApiSavedRoadmap,
  ApiSavedRoadmapSummary,
} from "@/lib/api-types";
import { db } from "@/lib/server/db";

// Auto-save can accumulate quickly; keep only the most recent N per user.
const MAX_SAVED_PER_USER = 20;

type SavedRoadmapInput = {
  subject: string;
  days: number;
  level: string;
  goal: string;
  provider: AiProviderName;
  model: string;
  contextNoteCount: number;
  plan: ApiRoadmapDay[];
};

type SavedRoadmapRow = {
  id: string;
  subject: string;
  days: number;
  level: string;
  goal: string;
  provider: string;
  model: string;
  contextNoteCount: number;
  plan: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

function planDays(plan: Prisma.JsonValue): ApiRoadmapDay[] {
  return Array.isArray(plan) ? (plan as unknown as ApiRoadmapDay[]) : [];
}

// Progress = completed task checkboxes / total, across all days (0-100).
function planProgress(days: ApiRoadmapDay[]): number {
  const total = days.reduce((sum, day) => sum + day.done.length, 0);
  if (!total) return 0;
  const done = days.reduce((sum, day) => sum + day.done.filter(Boolean).length, 0);
  return Math.round((done / total) * 100);
}

function serialize(row: SavedRoadmapRow): ApiSavedRoadmap {
  return {
    id: row.id,
    subject: row.subject,
    days: row.days,
    level: row.level,
    goal: row.goal,
    provider: row.provider as AiProviderName,
    model: row.model,
    contextNoteCount: row.contextNoteCount,
    plan: planDays(row.plan),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeSummary(row: SavedRoadmapRow): ApiSavedRoadmapSummary {
  return {
    id: row.id,
    subject: row.subject,
    days: row.days,
    level: row.level,
    goal: row.goal,
    progress: planProgress(planDays(row.plan)),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listSavedRoadmaps(userId: string): Promise<ApiSavedRoadmapSummary[]> {
  const rows = await db.savedRoadmap.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(serializeSummary);
}

export async function getSavedRoadmap(userId: string, id: string): Promise<ApiSavedRoadmap | null> {
  const row = await db.savedRoadmap.findFirst({ where: { id, userId } });
  return row ? serialize(row) : null;
}

export async function createSavedRoadmap(
  userId: string,
  input: SavedRoadmapInput,
): Promise<ApiSavedRoadmap> {
  const row = await db.savedRoadmap.create({
    data: {
      userId,
      subject: input.subject,
      days: input.days,
      level: input.level,
      goal: input.goal,
      provider: input.provider,
      model: input.model,
      contextNoteCount: input.contextNoteCount,
      plan: input.plan as unknown as Prisma.InputJsonValue,
    },
  });

  await pruneOldest(userId);
  return serialize(row);
}

// Progress-only update; content is immutable. Scoped to userId so a guessed id
// can never mutate another user's roadmap.
export async function updateSavedRoadmapProgress(
  userId: string,
  id: string,
  plan: ApiRoadmapDay[],
): Promise<ApiSavedRoadmap | null> {
  const result = await db.savedRoadmap.updateMany({
    where: { id, userId },
    data: { plan: plan as unknown as Prisma.InputJsonValue },
  });
  if (result.count === 0) return null;
  const row = await db.savedRoadmap.findUnique({ where: { id } });
  return row ? serialize(row) : null;
}

export async function deleteSavedRoadmap(userId: string, id: string): Promise<boolean> {
  const result = await db.savedRoadmap.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

// Trim the user's roadmaps down to the most recent MAX_SAVED_PER_USER.
async function pruneOldest(userId: string): Promise<void> {
  const stale = await db.savedRoadmap.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    skip: MAX_SAVED_PER_USER,
    select: { id: true },
  });
  if (!stale.length) return;
  await db.savedRoadmap.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
}
