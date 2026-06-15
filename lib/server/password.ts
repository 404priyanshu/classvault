import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Kept free of Next.js imports so prisma/seed.ts can use it under tsx.
// Passwords are stored as "scrypt:<salt-hex>:<hash-hex>".
export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Hash of an unguessable value. Sign-in verifies against this when the account
// or its password is missing, so a non-existent email costs the same scrypt
// work as a real one and does not leak account existence via response timing.
export const DUMMY_PASSWORD_HASH = hashPassword(randomBytes(32).toString("hex"));
