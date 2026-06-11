import { db } from "@/lib/server/db";

// Temporary auth: every request acts as the seeded demo student. Replace the
// internals with real session lookup (Auth.js / custom cookies) without
// changing any call sites.
const CURRENT_USER_EMAIL = "arjun.mehta@classvault.edu";

export async function getCurrentUser() {
  return db.user.findUnique({ where: { email: CURRENT_USER_EMAIL } });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Not signed in.");
  }
  return user;
}

export class AuthError extends Error {}
