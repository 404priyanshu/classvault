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

export type NotesResponse = {
  items: ApiNote[];
  nextCursor: string | null;
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
