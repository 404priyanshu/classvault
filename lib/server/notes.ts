import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiNote, FileType, NoteStatus } from "@/lib/api-types";
import { db } from "@/lib/server/db";
import type { notesQuerySchema, createNoteSchema } from "@/lib/server/validation";
import type { z } from "zod";

const noteInclude = (userId: string | null) =>
  ({
    owner: true,
    tags: { include: { tag: true } },
    savedBy: userId ? { where: { userId } } : false,
    ratings: userId ? { where: { userId } } : false,
  }) satisfies Prisma.NoteInclude;

export type NoteWithRelations = Prisma.NoteGetPayload<{
  include: {
    owner: true;
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

export async function listNotes(query: z.infer<typeof notesQuerySchema>, userId: string | null) {
  const ownerView = query.owner === "me" && userId;
  const where: Prisma.NoteWhereInput = ownerView
    ? { ownerId: userId, status: query.status ?? { not: "DELETED" } }
    : { status: "PUBLISHED" };

  if (query.q) {
    const match = { contains: query.q, mode: "insensitive" as const };
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

  const notes = await db.note.findMany({
    where,
    include: noteInclude(userId),
    orderBy: { createdAt: "desc" },
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  const hasMore = notes.length > query.limit;
  const items = (hasMore ? notes.slice(0, query.limit) : notes) as NoteWithRelations[];

  return {
    items: items.map((note) => serializeNote(note, userId)),
    nextCursor: hasMore ? items[items.length - 1].id : null,
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

    return tx.note.create({
      data: {
        title: input.title,
        description: input.description,
        subject: input.subject,
        semester: input.semester,
        courseCode: input.courseCode.toUpperCase(),
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

    // Seeded notes carry aggregate counts without per-user Rating rows.
    // Derive the immutable seed portion from the cached aggregate minus the
    // live rows, then fold live ratings back in after the upsert.
    const liveBefore = await tx.rating.aggregate({
      where: { noteId },
      _sum: { value: true },
      _count: true,
    });
    const seedCount = Math.max(0, note.ratingCount - liveBefore._count);
    const seedSum = Math.max(
      0,
      note.ratingAverage * note.ratingCount - (liveBefore._sum.value ?? 0),
    );

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

    const ratingCount = seedCount + liveAfter._count;
    const ratingAverage =
      ratingCount > 0 ? (seedSum + (liveAfter._sum.value ?? 0)) / ratingCount : 0;

    const updated = await tx.note.update({
      where: { id: noteId },
      data: { ratingAverage, ratingCount },
    });

    return {
      ratingAverage: Math.round(updated.ratingAverage * 10) / 10,
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
