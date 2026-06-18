import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiNotification, NotificationsResponse } from "@/lib/api-types";
import { db } from "@/lib/server/db";

type NotificationRow = {
  id: string;
  type: string;
  payload: Prisma.JsonValue;
  readAt: Date | null;
  createdAt: Date;
};

// Accepts either the shared client or a transaction client, so fan-out can
// happen inside the same transaction as the event that triggered it.
type DbClient = typeof db | Prisma.TransactionClient;

function serializeNotification(n: NotificationRow): ApiNotification {
  return {
    id: n.id,
    type: n.type,
    payload: (n.payload ?? {}) as Record<string, unknown>,
    read: n.readAt !== null,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function createNotification(
  client: DbClient,
  input: { userId: string; type: string; payload: Prisma.InputJsonValue },
) {
  await client.notification.create({
    data: { userId: input.userId, type: input.type, payload: input.payload },
  });
}

export async function listNotifications(userId: string): Promise<NotificationsResponse> {
  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items: items.map(serializeNotification), unreadCount };
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  await db.notification.updateMany({
    where: { userId, readAt: null, ...(ids?.length ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
}
