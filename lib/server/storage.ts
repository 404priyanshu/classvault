import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Local filesystem storage standing in for S3-compatible object storage.
// Swap these three functions for presigned-URL calls when moving to R2/S3;
// storage keys and the rest of the API stay unchanged.
const STORAGE_ROOT = path.join(process.cwd(), "var", "storage");

function resolveSafe(storageKey: string) {
  const resolved = path.resolve(STORAGE_ROOT, storageKey);
  if (!resolved.startsWith(STORAGE_ROOT + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

export function buildStorageKey(userId: string, fileName: string) {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  return `notes/${userId}/${randomUUID()}-${base}`;
}

export async function saveFile(storageKey: string, data: Buffer) {
  const target = resolveSafe(storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function readStoredFile(storageKey: string) {
  return readFile(resolveSafe(storageKey));
}
