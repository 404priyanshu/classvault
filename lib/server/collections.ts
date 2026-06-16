import { randomBytes } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import type { ApiCollection, ApiCollectionSummary } from "@/lib/api-types";
import { collectionSlugWhere } from "@/lib/server/collection-logic";
import { db } from "@/lib/server/db";
import { serializeNote, type NoteWithRelations } from "@/lib/server/notes";

const noteInclude = (userId: string | null) =>
  ({
    owner: true,
    tags: { include: { tag: true } },
    savedBy: userId ? { where: { userId } } : false,
    ratings: userId ? { where: { userId } } : false,
  }) satisfies Prisma.NoteInclude;

function slugify(title: string) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "set";
  return `${base}-${randomBytes(4).toString("hex")}`;
}

export async function listCollections(userId: string): Promise<ApiCollectionSummary[]> {
  const rows = await db.collection.findMany({
    where: { ownerId: userId },
    include: { _count: { select: { notes: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((collection) => ({
    id: collection.id,
    title: collection.title,
    slug: collection.slug,
    isPublic: collection.isPublic,
    noteCount: collection._count.notes,
    ownedByMe: true,
    createdAt: collection.createdAt.toISOString(),
  }));
}

async function loadFull(
  where: Prisma.CollectionWhereInput,
  userId: string | null,
): Promise<ApiCollection | null> {
  const collection = await db.collection.findFirst({
    where,
    include: {
      owner: true,
      notes: {
        orderBy: { position: "asc" },
        include: { note: { include: noteInclude(userId) } },
      },
    },
  });
  if (!collection) return null;
  return {
    id: collection.id,
    title: collection.title,
    slug: collection.slug,
    isPublic: collection.isPublic,
    noteCount: collection.notes.length,
    ownedByMe: userId !== null && collection.ownerId === userId,
    createdAt: collection.createdAt.toISOString(),
    owner: { id: collection.owner.id, name: collection.owner.name },
    notes: collection.notes.map((entry) => serializeNote(entry.note as NoteWithRelations, userId)),
  };
}

export function getOwnedCollection(id: string, userId: string) {
  return loadFull({ id, ownerId: userId }, userId);
}

// Visible if public, or owned by the requester.
export function getCollectionBySlug(slug: string, userId: string | null) {
  return loadFull(collectionSlugWhere(slug, userId) satisfies Prisma.CollectionWhereInput, userId);
}

export async function createCollection(
  userId: string,
  title: string,
  isPublic: boolean,
): Promise<ApiCollection> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const created = await db.collection.create({
        data: { ownerId: userId, title, isPublic, slug: slugify(title) },
      });
      const full = await getOwnedCollection(created.id, userId);
      if (full) return full;
      throw new Error("Collection vanished after creation.");
    } catch (error) {
      // Retry only on a slug collision (astronomically unlikely with the random suffix).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Could not allocate a unique collection slug.");
}

export async function updateCollection(
  userId: string,
  id: string,
  patch: { title?: string; isPublic?: boolean },
): Promise<ApiCollection | null> {
  const result = await db.collection.updateMany({ where: { id, ownerId: userId }, data: patch });
  if (result.count === 0) return null;
  return getOwnedCollection(id, userId);
}

export async function deleteCollection(userId: string, id: string): Promise<boolean> {
  const result = await db.collection.deleteMany({ where: { id, ownerId: userId } });
  return result.count > 0;
}

type MutateResult = { ok: true } | { ok: false; code: "NOT_FOUND" | "NOTE_NOT_FOUND" };

export async function addNoteToCollection(
  userId: string,
  collectionId: string,
  noteId: string,
): Promise<MutateResult> {
  const collection = await db.collection.findFirst({
    where: { id: collectionId, ownerId: userId },
    select: { id: true },
  });
  if (!collection) return { ok: false, code: "NOT_FOUND" };

  const note = await db.note.findFirst({
    where: { id: noteId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!note) return { ok: false, code: "NOTE_NOT_FOUND" };

  const last = await db.collectionNote.findFirst({
    where: { collectionId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await db.collectionNote.upsert({
    where: { collectionId_noteId: { collectionId, noteId } },
    update: {},
    create: { collectionId, noteId, position: (last?.position ?? -1) + 1 },
  });
  return { ok: true };
}

export async function removeNoteFromCollection(
  userId: string,
  collectionId: string,
  noteId: string,
): Promise<MutateResult> {
  const collection = await db.collection.findFirst({
    where: { id: collectionId, ownerId: userId },
    select: { id: true },
  });
  if (!collection) return { ok: false, code: "NOT_FOUND" };
  await db.collectionNote.deleteMany({ where: { collectionId, noteId } });
  return { ok: true };
}
