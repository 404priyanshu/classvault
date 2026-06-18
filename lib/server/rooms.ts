import type { ApiRoom } from "@/lib/api-types";
import { db } from "@/lib/server/db";
import { canViewCollegeOnlyRoom, roomListWhere } from "@/lib/server/room-logic";

type RoomRow = {
  id: string;
  name: string;
  subject: string;
  timerVal: number;
  type: string;
  goals: string[];
  _count?: { participants?: number };
};

function serializeRoom(row: RoomRow): ApiRoom {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    count: row._count?.participants ?? 0,
    timerVal: row.timerVal,
    type: row.type as "Public" | "College-only",
    goals: Array.isArray(row.goals) ? row.goals : [],
  };
}

export async function listRooms(user: { id: string; collegeName?: string | null; institutionId?: string | null }): Promise<ApiRoom[]> {
  const rooms = await db.room.findMany({
    where: roomListWhere({ institutionId: user.institutionId ?? null, collegeName: user.collegeName ?? null }),
    include: { _count: { select: { participants: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rooms.map(serializeRoom);
}

export async function createRoom(
  userId: string,
  input: { name: string; subject: string; type: "Public" | "College-only"; timerVal: number; goals: string[] },
): Promise<ApiRoom> {
  const room = await db.room.create({
    data: {
      ownerId: userId,
      name: input.name,
      subject: input.subject,
      type: input.type,
      timerVal: input.timerVal,
      goals: input.goals,
    },
  });
  // Auto-join the creator to match previous stub behavior (count starts at 1 for creator).
  await db.roomParticipant.create({ data: { roomId: room.id, userId } }).catch(() => {});
  const withCount = await db.room.findUnique({
    where: { id: room.id },
    include: { _count: { select: { participants: true } } },
  });
  return serializeRoom(withCount ?? room);
}

export async function joinRoom(
  roomId: string,
  userId: string,
  viewer: { collegeName?: string | null; institutionId?: string | null },
): Promise<{ ok: true } | { ok: false; code: "NOT_FOUND" | "FORBIDDEN" }> {
  const room = await db.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      type: true,
      owner: { select: { collegeName: true, institutionId: true } },
    },
  });
  if (!room) return { ok: false, code: "NOT_FOUND" };

  // College-only rooms are restricted to members of the same campus.
  if (room.type === "College-only") {
    const allowed = canViewCollegeOnlyRoom(
      {
        collegeName: room.owner.collegeName ?? null,
        institutionId: room.owner.institutionId ?? null,
      },
      {
        collegeName: viewer.collegeName ?? null,
        institutionId: viewer.institutionId ?? null,
      },
    );
    if (!allowed) return { ok: false, code: "FORBIDDEN" };
  }

  await db.roomParticipant.upsert({
    where: { roomId_userId: { roomId, userId } },
    update: {},
    create: { roomId, userId },
  });
  return { ok: true };
}

export async function leaveRoom(
  roomId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; code: "NOT_FOUND" }> {
  const room = await db.room.findUnique({ where: { id: roomId }, select: { id: true } });
  if (!room) return { ok: false, code: "NOT_FOUND" };
  await db.roomParticipant.deleteMany({ where: { roomId, userId } });
  return { ok: true };
}
