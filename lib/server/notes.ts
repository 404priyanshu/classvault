import { Prisma } from "@/lib/generated/prisma/client";
import type { ApiNote, FileType, NoteStatus } from "@/lib/api-types";
import { db } from "@/lib/server/db";
import {
  computeRatingAggregate,
  isFullTextQuery,
  orderByIds,
  roundToTenth,
} from "@/lib/server/note-logic";
import type { notesQuerySchema, createNoteSchema } from "@/lib/server/validation";
import type { z } from "zod";

const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const noteInclude = (userId: string | null) =>
  ({
    owner: true,
    course: { select: { id: true, code: true } },
    tags: { include: { tag: true } },
    savedBy: userId ? { where: { userId } } : false,
    ratings: userId ? { where: { userId } } : false,
  }) satisfies Prisma.NoteInclude;

export type NoteWithRelations = Prisma.NoteGetPayload<{
  include: {
    owner: true;
    course: { select: { id: true; code: true } };
    tags: { include: { tag: true } };
  };
}> & {
  savedBy?: Array<{ userId: string; noteId: string }>;
  ratings?: Array<{ value: number }>;
};

function ordinal(value: string) {
  const n = Number(value);
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${suffix}`;
}

export function roleLabelOf(user: { department: string | null; semester: string | null; role: string }) {
  if (user.department && user.semester) {
    return `${user.department}, ${ordinal(user.semester)} Semester`;
  }
  return user.role.charAt(0) + user.role.slice(1).toLowerCase();
}

export function serializeNote(note: NoteWithRelations, userId: string | null): ApiNote {
  return {
    id: note.id,
    title: note.title,
    description: note.description,
    subject: note.subject,
    semester: note.semester,
    courseCode: note.courseCode,
    course: note.course ? { id: note.course.id, code: note.course.code } : undefined,
    unit: note.unit,
    topic: note.topic,
    fileType: note.fileType as FileType,
    fileSizeBytes: note.fileSizeBytes,
    pageCount: note.pageCount,
    hasFile: Boolean(note.storageKey),
    status: note.status as NoteStatus,
    rejectionReason: note.rejectionReason,
    uploader: {
      id: note.owner.id,
      name: note.owner.name,
      roleLabel: roleLabelOf(note.owner),
    },
    tags: note.tags.map((noteTag) => noteTag.tag.name),
    ratingAverage: Math.round(note.ratingAverage * 10) / 10,
    ratingCount: note.ratingCount,
    downloadCount: note.downloadCount,
    savedByMe: (note.savedBy ?? []).length > 0,
    ownedByMe: userId !== null && note.ownerId === userId,
    myRating: (note.ratings ?? [])[0]?.value ?? null,
    createdAt: note.createdAt.toISOString(),
  };
}

// Multi-word queries hit the tsvector generated column (websearch semantics,
// ranked); single words keep the insensitive substring match, which works
// better for course codes like "CS302" and partial words.
async function searchRankedIds(q: string) {
  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "Note"
    WHERE "searchVector" @@ websearch_to_tsquery('english', ${q})
    ORDER BY ts_rank("searchVector", websearch_to_tsquery('english', ${q})) DESC
    LIMIT 200
  `);
  return rows.map((row) => row.id);
}

// Notes ordered by downloads inside the trending window; cached lifetime
// downloadCount breaks ties and covers windows with no recent activity.
async function trendingIds(limit: number) {
  const grouped = await db.downloadEvent.groupBy({
    by: ["noteId"],
    where: { createdAt: { gte: new Date(Date.now() - TRENDING_WINDOW_MS) } },
    _count: { noteId: true },
    orderBy: { _count: { noteId: "desc" } },
    take: limit,
  });
  return grouped.map((row) => row.noteId);
}

export async function listNotes(query: z.infer<typeof notesQuerySchema>, userId: string | null) {
  const ownerView = query.owner === "me" && userId;
  const where: Prisma.NoteWhereInput = ownerView
    ? { ownerId: userId, status: query.status ?? { not: "DELETED" } }
    : { status: "PUBLISHED" };

  const q = query.q?.trim();
  const useFts = isFullTextQuery(q);
  let rankedIds: string[] = [];

  if (q && useFts) {
    rankedIds = await searchRankedIds(q);
    const match = { contains: q, mode: "insensitive" as const };
    // Rank-ordered tsvector hits, plus tag/code matches FTS cannot see.
    where.OR = [
      { id: { in: rankedIds } },
      { courseCode: match },
      { tags: { some: { tag: { name: match } } } },
    ];
  } else if (q) {
    const match = { contains: q, mode: "insensitive" as const };
    where.OR = [
      { title: match },
      { description: match },
      { subject: match },
      { topic: match },
      { courseCode: match },
      { unit: match },
      { tags: { some: { tag: { name: match } } } },
    ];
  }
  if (query.subject) where.subject = query.subject;
  if (query.semester) where.semester = query.semester;
  if (query.tag) where.tags = { some: { tag: { name: query.tag } } };
  if (query.saved === "true" && userId) where.savedBy = { some: { userId } };

  const trending = query.sort === "trending" && !q;
  const trendingOrder = trending ? await trendingIds(query.limit) : [];

  const notes = await db.note.findMany({
    where,
    include: noteInclude(userId),
    orderBy: trending ? { downloadCount: "desc" } : { createdAt: "desc" },
    take: query.limit + 1,
    ...(query.cursor && !useFts ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  const hasMore = notes.length > query.limit;
  let items = (hasMore ? notes.slice(0, query.limit) : notes) as NoteWithRelations[];

  // Re-apply the externally computed orderings findMany cannot express.
  if (useFts || trendingOrder.length) {
    items = orderByIds(items, useFts ? rankedIds : trendingOrder);
  }

  return {
    items: items.map((note) => serializeNote(note, userId)),
    // Rank-based orderings cannot resume from an id cursor; cap them at one page.
    nextCursor: hasMore && !useFts ? items[items.length - 1].id : null,
  };
}

export async function getNote(noteId: string, userId: string | null) {
  const note = await db.note.findFirst({
    where: { id: noteId, status: "PUBLISHED" },
    include: noteInclude(userId),
  });
  return note ? serializeNote(note as NoteWithRelations, userId) : null;
}

export async function createNote(
  input: z.infer<typeof createNoteSchema> & { fileType: FileType; fileSizeBytes: number },
  ownerId: string,
) {
  const tagNames = Array.from(new Set(input.tags.map((tag) => tag.trim()).filter(Boolean)));

  const note = await db.$transaction(async (tx) => {
    const tags = await Promise.all(
      tagNames.map((name) =>
        tx.tag.upsert({ where: { name }, update: {}, create: { name } }),
      ),
    );

    const courseCodeUpper = input.courseCode.toUpperCase();
    const course = await tx.course.upsert({
      where: { code: courseCodeUpper },
      update: {},
      create: { code: courseCodeUpper, subject: input.subject },
    });

    return tx.note.create({
      data: {
        title: input.title,
        description: input.description,
        subject: input.subject,
        semester: input.semester,
        courseCode: courseCodeUpper,
        courseId: course.id,
        unit: input.unit || "Uploaded resource",
        topic: input.topic || tagNames[0] || "Student contribution",
        fileType: input.fileType,
        fileSizeBytes: input.fileSizeBytes,
        storageKey: input.storageKey,
        status: "PENDING",
        rejectionReason: null,
        reviewedAt: null,
        reviewedById: null,
        ownerId,
        tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
      },
      include: noteInclude(ownerId),
    });
  });

  return serializeNote(note as NoteWithRelations, ownerId);
}

export async function setSaved(noteId: string, userId: string, saved: boolean) {
  const note = await db.note.findFirst({ where: { id: noteId, status: "PUBLISHED" } });
  if (!note) return null;

  if (saved) {
    await db.savedNote.upsert({
      where: { userId_noteId: { userId, noteId } },
      update: {},
      create: { userId, noteId },
    });
  } else {
    await db.savedNote.deleteMany({ where: { userId, noteId } });
  }
  return { saved };
}

export async function rateNote(noteId: string, userId: string, value: number) {
  return db.$transaction(async (tx) => {
    const note = await tx.note.findFirst({ where: { id: noteId, status: "PUBLISHED" } });
    if (!note) return null;

    // Snapshot live rows before the write; the pure helper folds the seed
    // aggregate (cached totals minus these) back in afterward.
    const liveBefore = await tx.rating.aggregate({
      where: { noteId },
      _sum: { value: true },
      _count: true,
    });

    await tx.rating.upsert({
      where: { userId_noteId: { userId, noteId } },
      update: { value },
      create: { userId, noteId, value },
    });

    const liveAfter = await tx.rating.aggregate({
      where: { noteId },
      _sum: { value: true },
      _count: true,
    });

    const { ratingAverage, ratingCount } = computeRatingAggregate({
      cachedAverage: note.ratingAverage,
      cachedCount: note.ratingCount,
      liveCountBefore: liveBefore._count,
      liveSumBefore: liveBefore._sum.value ?? 0,
      liveCountAfter: liveAfter._count,
      liveSumAfter: liveAfter._sum.value ?? 0,
    });

    const updated = await tx.note.update({
      where: { id: noteId },
      data: { ratingAverage, ratingCount },
    });

    return {
      ratingAverage: roundToTenth(updated.ratingAverage),
      ratingCount: updated.ratingCount,
      myRating: value,
    };
  });
}

export async function recordDownload(noteId: string, userId: string | null) {
  return db.$transaction(async (tx) => {
    const note = await tx.note.findFirst({ where: { id: noteId, status: "PUBLISHED" } });
    if (!note) return null;

    await tx.downloadEvent.create({ data: { noteId, userId } });
    const updated = await tx.note.update({
      where: { id: noteId },
      data: { downloadCount: { increment: 1 } },
    });

    return {
      downloadUrl: note.storageKey ? `/api/notes/${noteId}/file` : null,
      downloadCount: updated.downloadCount,
    };
  });
}
