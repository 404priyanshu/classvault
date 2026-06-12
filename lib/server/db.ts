import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }
  const adapter = new PrismaPg({ connectionString });
  // Generous transaction limits: Neon's free tier suspends compute when idle
  // and takes a few seconds to wake, which overruns Prisma's 2s default and
  // fails the first transaction after idle with P2028.
  return new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 15_000, timeout: 20_000 },
  });
}

// Reuse one client across dev hot reloads to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
