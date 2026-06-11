import { z } from "zod";

export const FILE_TYPES = ["PDF", "DOCX", "PPTX", "ZIP"] as const;

export const ALLOWED_MIME_TYPES: Record<string, (typeof FILE_TYPES)[number]> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/zip": "ZIP",
  "application/x-zip-compressed": "ZIP",
};

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const notesQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  subject: z.string().trim().max(120).optional(),
  semester: z.string().trim().max(2).optional(),
  tag: z.string().trim().max(60).optional(),
  owner: z.literal("me").optional(),
  saved: z.literal("true").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const createNoteSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).default(""),
  subject: z.string().trim().min(1).max(120),
  semester: z.enum(["1", "2", "3", "4", "5", "6", "7", "8"]),
  courseCode: z.string().trim().min(1).max(20),
  unit: z.string().trim().max(120).default(""),
  topic: z.string().trim().max(120).default(""),
  storageKey: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
});

export const ratingSchema = z.object({
  value: z.number().int().min(1).max(5),
});
