import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/server/validation";

// Local filesystem storage standing in for S3-compatible object storage.
// Storage keys and the rest of the API stay unchanged between local and S3.
const STORAGE_ROOT = path.join(process.cwd(), "var", "storage");
const S3_UPLOAD_URL_TTL_SECONDS = 10 * 60;
const S3_DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

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

export function getS3Config() {
  const region = envValue("AWS_REGION");
  const accessKeyId = envValue("AWS_ACCESS_KEY_ID");
  const secretAccessKey = envValue("AWS_SECRET_ACCESS_KEY");
  const sessionToken = envValue("AWS_SESSION_TOKEN");
  const bucket = envValue("AWS_S3_BUCKET");
  const publicBaseUrl = envValue("AWS_S3_PUBLIC_BASE_URL")?.replace(/\/+$/, "") ?? null;
  if (!region || !bucket) return null;
  return {
    region,
    accessKeyId,
    secretAccessKey,
    sessionToken,
    bucket,
    publicBaseUrl,
  };
}

function s3Client() {
  const config = getS3Config();
  if (!config) return null;
  return {
    config,
    client: new S3Client({
      region: config.region,
      ...(config.accessKeyId && config.secretAccessKey
        ? {
            credentials: {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
              ...(config.sessionToken ? { sessionToken: config.sessionToken } : {}),
            },
          }
        : {}),
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
  const s3 = s3Client();
  if (!s3) {
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
    Bucket: s3.config.bucket,
    Key: storageKey,
    ContentType: mimeType,
  });
  const uploadUrl = await getSignedUrl(s3.client, command, { expiresIn: S3_UPLOAD_URL_TTL_SECONDS });
  return {
    provider: "S3" as const,
    storageKey,
    uploadUrl,
    method: "PUT" as const,
    publicUrl: s3.config.publicBaseUrl ? `${s3.config.publicBaseUrl}/${storageKey}` : null,
    expiresIn: S3_UPLOAD_URL_TTL_SECONDS,
  };
}

export async function createDownloadUrl(
  storageKey: string,
  options: {
    fileName?: string;
    contentType?: string;
    disposition?: "attachment" | "inline";
  } = {},
) {
  const s3 = s3Client();
  if (!s3) return null;
  if (s3.config.publicBaseUrl) return `${s3.config.publicBaseUrl}/${storageKey}`;
  const safeFileName = options.fileName?.replace(/["\\]/g, "").replace(/[\r\n]/g, "");
  const command = new GetObjectCommand({
    Bucket: s3.config.bucket,
    Key: storageKey,
    ...(options.contentType ? { ResponseContentType: options.contentType } : {}),
    ...(safeFileName
      ? { ResponseContentDisposition: `${options.disposition ?? "attachment"}; filename="${safeFileName}"` }
      : {}),
  });
  return getSignedUrl(s3.client, command, { expiresIn: S3_DOWNLOAD_URL_TTL_SECONDS });
}

export async function checkS3Access() {
  const s3 = s3Client();
  if (!s3) return null;
  await s3.client.send(new HeadBucketCommand({ Bucket: s3.config.bucket }));
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
