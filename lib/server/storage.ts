import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/server/validation";

// Local filesystem storage standing in for S3-compatible object storage.
// Swap these three functions for presigned-URL calls when moving to R2/S3;
// storage keys and the rest of the API stay unchanged.
const STORAGE_ROOT = path.join(process.cwd(), "var", "storage");
const R2_UPLOAD_URL_TTL_SECONDS = 10 * 60;
const R2_DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

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

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getR2Config() {
  const accountId = envValue("R2_ACCOUNT_ID");
  const accessKeyId = envValue("R2_ACCESS_KEY_ID");
  const secretAccessKey = envValue("R2_SECRET_ACCESS_KEY");
  const bucket = envValue("R2_BUCKET");
  const publicBaseUrl = envValue("R2_PUBLIC_BASE_URL")?.replace(/\/+$/, "") ?? null;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
  };
}

function r2Client() {
  const config = getR2Config();
  if (!config) return null;
  return {
    config,
    client: new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
  };
}

export function validateUploadMetadata(mimeType: string, sizeBytes: number) {
  const fileType = ALLOWED_MIME_TYPES[mimeType];
  if (!fileType) {
    return { ok: false as const, message: "Unsupported file type. Allowed: PDF, DOCX, PPTX, ZIP." };
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { ok: false as const, message: "File must be between 1 byte and 25 MB." };
  }
  return { ok: true as const, fileType };
}

export async function createUploadTarget({
  userId,
  fileName,
  mimeType,
}: {
  userId: string;
  fileName: string;
  mimeType: string;
}) {
  const storageKey = buildStorageKey(userId, fileName);
  const r2 = r2Client();
  if (!r2) {
    return {
      provider: "LOCAL" as const,
      storageKey,
      uploadUrl: "/api/uploads",
      method: "POST" as const,
      publicUrl: null,
      expiresIn: null,
    };
  }

  const command = new PutObjectCommand({
    Bucket: r2.config.bucket,
    Key: storageKey,
    ContentType: mimeType,
  });
  const uploadUrl = await getSignedUrl(r2.client, command, { expiresIn: R2_UPLOAD_URL_TTL_SECONDS });
  return {
    provider: "R2" as const,
    storageKey,
    uploadUrl,
    method: "PUT" as const,
    publicUrl: r2.config.publicBaseUrl ? `${r2.config.publicBaseUrl}/${storageKey}` : null,
    expiresIn: R2_UPLOAD_URL_TTL_SECONDS,
  };
}

export function publicFileUrl(storageKey: string) {
  const config = getR2Config();
  return config?.publicBaseUrl ? `${config.publicBaseUrl}/${storageKey}` : null;
}

export async function createDownloadUrl(storageKey: string) {
  const r2 = r2Client();
  if (!r2) return null;
  if (r2.config.publicBaseUrl) return `${r2.config.publicBaseUrl}/${storageKey}`;
  const command = new GetObjectCommand({
    Bucket: r2.config.bucket,
    Key: storageKey,
  });
  return getSignedUrl(r2.client, command, { expiresIn: R2_DOWNLOAD_URL_TTL_SECONDS });
}

export async function checkR2Access() {
  const r2 = r2Client();
  if (!r2) return null;
  await r2.client.send(new HeadBucketCommand({ Bucket: r2.config.bucket }));
  return true;
}

export async function saveFile(storageKey: string, data: Buffer) {
  const target = resolveSafe(storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function readStoredFile(storageKey: string) {
  return readFile(resolveSafe(storageKey));
}
