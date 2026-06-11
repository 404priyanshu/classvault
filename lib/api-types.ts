// Response shapes shared between API routes and client components.
// Keep this file free of server-only imports.

export type FileType = "PDF" | "DOCX" | "PPTX" | "ZIP";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
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
