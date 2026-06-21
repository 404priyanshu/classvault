import { z } from "zod";

type FileType = "PDF" | "DOCX" | "PPTX" | "ZIP";
const NOTE_STATUSES = ["PENDING", "PUBLISHED", "REJECTED", "HIDDEN", "DELETED"] as const;
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export const ALLOWED_MIME_TYPES: Record<string, FileType> = {
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

export const suggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(10).default(8),
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

export const collegeVerificationStartSchema = z.object({
  collegeName: z.string().trim().min(2).max(120),
  collegeEmail: z.string().trim().max(254).pipe(z.email()),
});

export const collegeVerificationVerifySchema = z.object({
  collegeEmail: z.string().trim().max(254).pipe(z.email()),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the six-digit code."),
});

export const reportSchema = z.object({
  noteId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().max(1000).optional(),
});

export const reportResolutionSchema = z.object({
  reportId: z.string().trim().min(1),
  status: z.enum(["RESOLVED", "DISMISSED"]),
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

export const createStudyTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentId: z.string().trim().min(1).optional(),
});

export const hideCommentSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export const aiRoadmapRequestSchema = z.object({
  subject: z.string().trim().min(2).max(120),
  days: z.coerce.number().int().min(1).max(7).default(5),
  level: z.enum(["Beginner", "Okay", "Strong"]).default("Beginner"),
  goal: z.enum(["Pass quickly", "Score high", "Deep understanding", "Interview prep"]).default("Score high"),
  sources: z
    .object({
      personal: z.boolean().default(true),
      community: z.boolean().default(true),
      pyq: z.boolean().default(true),
      video: z.boolean().default(true),
    })
    .default({ personal: true, community: true, pyq: true, video: true }),
});

const aiRoadmapDaySchema = z.object({
  day: z.coerce.number().int().min(1).max(14),
  title: z.string().trim().min(3).max(80),
  topic: z.string().trim().min(10).max(500),
  resources: z.array(z.string().trim().min(1).max(140)).min(1).max(5),
  tasks: z.array(z.string().trim().min(1).max(180)).min(2).max(5),
  pyqs: z.array(z.string().trim().min(1).max(180)).min(1).max(4),
});

export const aiRoadmapResponseSchema = z.object({
  days: z.array(aiRoadmapDaySchema).min(1).max(7),
});

export const updateStudyTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    done: z.boolean().optional(),
  })
  .refine((value) => value.title !== undefined || value.done !== undefined, {
    message: "Provide a title or done state to update.",
  });

// A persisted roadmap day extends the generated shape with per-task progress.
const savedRoadmapDaySchema = aiRoadmapDaySchema.extend({
  done: z.array(z.boolean()).max(20),
});

const savedRoadmapPlanSchema = z.array(savedRoadmapDaySchema).min(1).max(7);

export const createSavedRoadmapSchema = z.object({
  subject: z.string().trim().min(2).max(120),
  days: z.coerce.number().int().min(1).max(7),
  level: z.enum(["Beginner", "Okay", "Strong"]),
  goal: z.enum(["Pass quickly", "Score high", "Deep understanding", "Interview prep"]),
  provider: z.enum(["gemini", "openai"]),
  model: z.string().trim().min(1).max(120),
  contextNoteCount: z.coerce.number().int().min(0).max(10000).default(0),
  plan: savedRoadmapPlanSchema,
});

// Resuming persists only progress (the done[] toggles); content is immutable.
export const updateSavedRoadmapSchema = z.object({
  plan: savedRoadmapPlanSchema,
});

export const aiNoteSuggestionRequestSchema = z.object({
  title: z.string().trim().min(3).max(120),
  subject: z.string().trim().min(1).max(120),
  courseCode: z.string().trim().min(1).max(20),
  unit: z.string().trim().max(120).default(""),
  fileName: z.string().trim().max(240).default(""),
});

export const aiNoteSuggestionResponseSchema = z.object({
  description: z.string().trim().min(1).max(600),
  tags: z.array(z.string().trim().min(1).max(40)).max(6).default([]),
});

export const aiExamPlanRequestSchema = z.object({
  subject: z.string().trim().min(2).max(120),
  examDays: z.coerce.number().int().min(1).max(14).default(3),
  studyHoursPerDay: z.coerce.number().int().min(1).max(16).default(4),
  weakTopics: z.string().trim().max(500).default(""),
});

export const aiExamPlanResponseSchema = z.object({
  mustStudy: z
    .array(
      z.object({
        topic: z.string().trim().min(2).max(160),
        examProbability: z.coerce.number().int().min(0).max(100),
        why: z.string().trim().max(200).default(""),
      }),
    )
    .min(1)
    .max(8),
  canSkip: z.array(z.string().trim().min(1).max(160)).max(6).default([]),
  checkpoints: z.array(z.string().trim().min(1).max(160)).min(1).max(8),
  insight: z.string().trim().min(1).max(400),
});

export const createCollectionSchema = z.object({
  title: z.string().trim().min(2).max(80),
  isPublic: z.boolean().default(false),
});

export const updateCollectionSchema = z
  .object({
    title: z.string().trim().min(2).max(80).optional(),
    isPublic: z.boolean().optional(),
  })
  .refine((value) => value.title !== undefined || value.isPublic !== undefined, {
    message: "Provide a title or visibility to update.",
  });

export const collectionNoteSchema = z.object({
  noteId: z.string().trim().min(1),
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(2).max(80),
  subject: z.string().trim().min(1).max(120),
  type: z.enum(["Public", "College-only"]),
  timerVal: z.number().int().min(5).max(120),
  goals: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
});

export const createCheckoutSessionSchema = z.object({
  institutionId: z.string().trim().min(1),
  plan: z.enum(["starter", "pro", "enterprise"]).default("starter"),
});
