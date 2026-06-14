import { z } from "zod";

export const FILE_TYPES = ["PDF", "DOCX", "PPTX", "ZIP"] as const;
export const USER_ROLES = ["STUDENT", "MODERATOR", "ADMIN"] as const;
export const NOTE_STATUSES = ["PENDING", "PUBLISHED", "REJECTED", "HIDDEN", "DELETED"] as const;
export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

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
  status: z.enum(NOTE_STATUSES).optional(),
  sort: z.enum(["recent", "trending"]).default("recent"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const createNoteSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).default(""),
  subject: z.string().trim().min(1).max(120),
  semester: z.enum(SEMESTERS),
  courseCode: z.string().trim().min(1).max(20),
  unit: z.string().trim().max(120).default(""),
  topic: z.string().trim().max(120).default(""),
  storageKey: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
});

export const ratingSchema = z.object({
  value: z.number().int().min(1).max(5),
});

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    department: z.string().trim().max(40).nullable().optional(),
    semester: z.enum(SEMESTERS).nullable().optional(),
    age: z.coerce.number().int().min(13).max(80).nullable().optional(),
    subjectPreferences: z
      .array(z.string().trim().min(2).max(80))
      .max(8)
      .optional(),
    completeOnboarding: z.boolean().optional(),
  })
  .superRefine((input, ctx) => {
    if (!input.completeOnboarding) return;
    if (!input.semester) {
      ctx.addIssue({
        code: "custom",
        path: ["semester"],
        message: "Choose your semester.",
      });
    }
    if (!input.age) {
      ctx.addIssue({
        code: "custom",
        path: ["age"],
        message: "Enter your age.",
      });
    }
    if (!input.subjectPreferences?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["subjectPreferences"],
        message: "Choose at least one subject preference.",
      });
    }
  });

export const reportSchema = z.object({
  noteId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().max(1000).optional(),
});

export const adminNotesQuerySchema = z.object({
  status: z.enum(NOTE_STATUSES).default("PENDING"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const moderationSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export const presignUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(200),
  sizeBytes: z.number().int().min(1).max(MAX_FILE_SIZE_BYTES),
});
