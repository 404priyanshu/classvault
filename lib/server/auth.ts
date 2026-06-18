import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/api-types";
import { db } from "@/lib/server/db";

export { verifyPassword, DUMMY_PASSWORD_HASH } from "@/lib/server/password";

export const SESSION_COOKIE = "classvault_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Only the SHA-256 of the session token touches the database; the raw token
// lives exclusively in the browser cookie.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function envList(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email: string) {
  return envList("ADMIN_EMAILS").includes(email.trim().toLowerCase());
}

export function isAllowedCampusEmail(email: string) {
  const domains = envList("ALLOWED_EMAIL_DOMAINS");
  if (!domains.length) return true;
  const domain = email.trim().toLowerCase().split("@")[1];
  return Boolean(domain && domains.includes(domain));
}

export function roleForEmail(email: string, fallback: UserRole = "STUDENT"): UserRole {
  return isAdminEmail(email) ? "ADMIN" : fallback;
}

export async function applyUserBootstrap<T extends { id: string; email: string; role: string }>(
  user: T,
): Promise<T> {
  const targetRole = roleForEmail(user.email, user.role as UserRole);
  if (targetRole === user.role) return user;
  await db.user.update({ where: { id: user.id }, data: { role: targetRole } });
  return { ...user, role: targetRole } as T;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });
  return { token, expiresAt };
}

export async function destroyCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { institution: { select: { id: true } } } } },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await db.session.delete({ where: { tokenHash: session.tokenHash } }).catch(() => {});
    return null;
  }
  return applyUserBootstrap(session.user);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Not signed in.");
  }
  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireCurrentUser();
  if (!roles.includes(user.role as UserRole)) {
    throw new AuthError("You do not have access to this area.");
  }
  return user;
}

export class AuthError extends Error {}
