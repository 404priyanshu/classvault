import type { NoteStatus } from "@/lib/api-types";
import type { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/server/db";
import { serializeNote, type NoteWithRelations } from "@/lib/server/notes";

const ADMIN_NOTE_INCLUDE = {
  owner: true,
  tags: { include: { tag: true } },
  savedBy: false,
  ratings: false,
} as const;

type AdminNoteWithRelations = Prisma.NoteGetPayload<{ include: typeof ADMIN_NOTE_INCLUDE }>;

function serializeAdminNote(note: AdminNoteWithRelations) {
  return serializeNote(note as NoteWithRelations, null);
}

export async function listAdminNotes(status: NoteStatus, limit: number) {
  const notes = await db.note.findMany({
    where: { status },
    include: ADMIN_NOTE_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return notes.map(serializeAdminNote);
}

export async function moderateNote({
  noteId,
  moderatorId,
  action,
  reason,
}: {
  noteId: string;
  moderatorId: string;
  action: "APPROVE" | "REJECT" | "HIDE" | "RESTORE";
  reason?: string;
}) {
  const statusByAction = {
    APPROVE: "PUBLISHED",
    REJECT: "REJECTED",
    HIDE: "HIDDEN",
    RESTORE: "PUBLISHED",
  } satisfies Record<typeof action, NoteStatus>;

  return db.$transaction(async (tx) => {
    const note = await tx.note.update({
      where: { id: noteId },
      data: {
        status: statusByAction[action],
        rejectionReason: action === "REJECT" ? (reason || "Rejected by moderation.") : null,
        reviewedAt: new Date(),
        reviewedById: moderatorId,
      },
      include: ADMIN_NOTE_INCLUDE,
    });

    await tx.moderationEvent.create({
      data: { noteId, moderatorId, action, reason: reason || null },
    });

    return serializeAdminNote(note);
  });
}

export async function listReports() {
  const reports = await db.report.findMany({
    where: { status: "OPEN" },
    include: {
      note: { include: ADMIN_NOTE_INCLUDE },
      reporter: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return reports.map((report) => ({
    id: report.id,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    note: serializeAdminNote(report.note),
    reporter: report.reporter,
  }));
}
