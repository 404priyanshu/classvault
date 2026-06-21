// Response shapes shared between API routes and client components.
// Keep this file free of server-only imports.

export type FileType = "PDF" | "DOCX" | "PPTX" | "ZIP";
export type UserRole = "STUDENT" | "MODERATOR" | "ADMIN";
export type NoteStatus = "PENDING" | "PUBLISHED" | "REJECTED" | "HIDDEN" | "DELETED";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  semester: string | null;
  age: number | null;
  subjectPreferences: string[];
  collegeName: string | null;
  collegeEmail: string | null;
  collegeVerifiedAt: string | null;
  isCollegeVerified: boolean;
  hasCompletedOnboarding: boolean;
  roleLabel: string;
};

export type ApiNote = {
  id: string;
  title: string;
  description: string;
  subject: string;
  semester: string;
  courseCode: string;
  course?: { id: string; code: string };
  unit: string;
  topic: string;
  fileType: FileType;
  fileSizeBytes: number;
  pageCount: number | null;
  hasFile: boolean;
  status: NoteStatus;
  rejectionReason: string | null;
  uploader: { id: string; name: string; roleLabel: string };
  tags: string[];
  ratingAverage: number;
  ratingCount: number;
  downloadCount: number;
  savedByMe: boolean;
  ownedByMe: boolean;
  myRating: number | null;
  createdAt: string;
};

export type ApiStudyTask = {
  id: string;
  title: string;
  done: boolean;
};

export type ApiComment = {
  id: string;
  body: string;
  deleted: boolean;
  author: { id: string; name: string; roleLabel: string };
  parentId: string | null;
  ownedByMe: boolean;
  canModerate: boolean;
  createdAt: string;
  replies: ApiComment[];
};

export type CommentsResponse = {
  items: ApiComment[];
  count: number;
};

export type ApiNotification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  items: ApiNotification[];
  unreadCount: number;
};

export type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  note: ApiNote;
  reporter: { id: string; name: string; email: string } | null;
};

export type ApiLeaderboardEntry = {
  userId: string;
  name: string;
  roleLabel: string;
  score: number;
  publishedCount: number;
  downloadsReceived: number;
  avgRating: number;
};

export type LeaderboardResponse = {
  entries: ApiLeaderboardEntry[];
  me: (ApiLeaderboardEntry & { rank: number }) | null;
};

export type ApiRoadmapDay = {
  day: number;
  title: string;
  topic: string;
  resources: string[];
  tasks: string[];
  pyqs: string[];
  done: boolean[];
};

export type AiProviderName = "gemini" | "openai";

export type AiRoadmapResponse = {
  provider: AiProviderName;
  model: string;
  contextNoteCount: number;
  days: ApiRoadmapDay[];
};

// A persisted roadmap the user can resume. `plan` carries content + progress.
export type ApiSavedRoadmap = {
  id: string;
  subject: string;
  days: number;
  level: string;
  goal: string;
  provider: AiProviderName;
  model: string;
  contextNoteCount: number;
  plan: ApiRoadmapDay[];
  createdAt: string;
  updatedAt: string;
};

// Lightweight row for the "Saved roadmaps" picker (no full plan payload).
export type ApiSavedRoadmapSummary = {
  id: string;
  subject: string;
  days: number;
  level: string;
  goal: string;
  progress: number; // 0-100, derived from plan done[] counts
  updatedAt: string;
};

export type SavedRoadmapsResponse = {
  items: ApiSavedRoadmapSummary[];
};

export type AiNoteSuggestion = {
  description: string;
  tags: string[];
};

export type ExamPlanTopic = {
  topic: string;
  examProbability: number;
  why: string;
};

export type AiExamPlanResponse = {
  provider: AiProviderName;
  model: string;
  contextNoteCount: number;
  mustStudy: ExamPlanTopic[];
  canSkip: string[];
  checkpoints: string[];
  insight: string;
};

export type ApiCollectionSummary = {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  noteCount: number;
  ownedByMe: boolean;
  createdAt: string;
};

export type ApiCollection = ApiCollectionSummary & {
  owner: { id: string; name: string };
  notes: ApiNote[];
};

export type CollectionsResponse = {
  items: ApiCollectionSummary[];
};

export type ApiRoom = {
  id: string;
  name: string;
  subject: string;
  count: number;
  timerVal: number;
  type: "Public" | "College-only";
  goals: string[];
};

export type NotesResponse = {
  items: ApiNote[];
  nextCursor: string | null;
};

// Lightweight autocomplete hit for the typeahead endpoint (/api/notes/suggest).
export type ApiNoteSuggestion = {
  id: string;
  title: string;
  subject: string;
  courseCode: string;
};

export type NoteSuggestResponse = {
  items: ApiNoteSuggestion[];
};

export type MetaResponse = {
  subjects: string[];
  semesters: string[];
  stats: {
    totalNotes: number;
    savedCount: number;
    uploadCount: number;
    totalDownloads: number;
    ratingAverage: number;
  };
};

export type ApiError = {
  error: { code: string; message: string };
};
