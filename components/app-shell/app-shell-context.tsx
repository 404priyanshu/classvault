"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ApiError, ApiNote, ApiUser, MetaResponse } from "@/lib/api-types";
import {
  AuthPromptDialog,
  UploadDialog,
  type UploadDraft,
} from "@/components/app-shell/chrome";
import { DetailDrawer } from "@/components/notes/note-ui";

type NotePatch = Partial<ApiNote>;
type NotePatchListener = (noteId: string, patch: NotePatch) => void;

const AUTH_BANNER_SESSION_KEY = "classvault_auth_banner_dismissed";

class AuthRequiredError extends Error {}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error?.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

type UploadTargetResponse = {
  storageKey: string;
  uploadUrl: string;
  method: "PUT" | "POST";
  provider: "S3" | "LOCAL";
  expiresIn: number | null;
  fileType: ApiNote["fileType"];
  fileSizeBytes: number;
};

type AppShellContextValue = {
  me: ApiUser | null;
  authChecked: boolean;
  meta: MetaResponse | null;
  stats: MetaResponse["stats"] | undefined;
  refreshMeta: () => Promise<void>;
  requireAuth: <T>(fn: () => T) => T | undefined;
  openAuthPrompt: () => void;
  openUpload: () => void;
  toast: string | null;
  setToast: (message: string | null) => void;
  showAuthBanner: boolean;
  dismissAuthBanner: () => void;
  openNoteDetail: (note: ApiNote) => void;
  subscribeNotePatch: (listener: NotePatchListener) => () => void;
  signOut: () => Promise<void>;
  saveProfile: (input: {
    name: string;
    department: string | null;
    semester: string | null;
  }) => Promise<void>;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error("useAppShell must be used within <AppShellProvider>");
  }
  return ctx;
}

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<ApiUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [authBannerDismissed, setAuthBannerDismissed] = useState(false);

  const openAuthPrompt = useCallback(() => setAuthPromptOpen(true), []);

  const refreshMeta = useCallback(async () => {
    try {
      const response = await fetch("/api/meta");
      if (response.ok) setMeta((await response.json()) as MetaResponse);
    } catch {
      // non-fatal; stats refresh on next successful call
    }
  }, []);

  // Session + meta bootstrap (mirrors the legacy monolith bootstrap).
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      void refreshMeta();
      try {
        const response = await fetch("/api/me");
        if (response.ok) setMe((await response.json()) as ApiUser);
      } catch {
        // chrome degrades gracefully without a user
      } finally {
        setAuthChecked(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshMeta]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setAuthBannerDismissed(sessionStorage.getItem(AUTH_BANNER_SESSION_KEY) === "true");
      } catch {
        // Ignore
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const requireAuth = useCallback(
    <T,>(fn: () => T) => {
      if (!me) {
        openAuthPrompt();
        return undefined;
      }
      return fn();
    },
    [me, openAuthPrompt],
  );

  const assertResponseOk = useCallback(
    async (response: Response) => {
      if (response.ok) return;
      if (response.status === 401) {
        openAuthPrompt();
        throw new AuthRequiredError();
      }
      throw new Error(await readError(response));
    },
    [openAuthPrompt],
  );

  const openUpload = useCallback(() => {
    requireAuth(() => setUploadOpen(true));
  }, [requireAuth]);

  const dismissAuthBanner = useCallback(() => {
    setAuthBannerDismissed(true);
    try {
      sessionStorage.setItem(AUTH_BANNER_SESSION_KEY, "true");
    } catch {
      // Ignore
    }
  }, []);

  const submitUpload = useCallback(
    async (draft: UploadDraft) => {
      if (!me) {
        openAuthPrompt();
        return false;
      }
      if (!draft.file) {
        setToast("Choose a file to upload.");
        return false;
      }
      if (draft.file.size > 25 * 1024 * 1024) {
        setToast("File is too large. Maximum size is 25 MB.");
        return false;
      }
      const allowedExtensions = ["pdf", "docx", "pptx", "zip"];
      const extension = draft.file.name.split(".").pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        setToast("Invalid file type. Only PDF, DOCX, PPTX, and ZIP files are allowed.");
        return false;
      }
      try {
        let storageKey: string;
        const presignResponse = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: draft.file.name,
            mimeType: draft.file.type,
            sizeBytes: draft.file.size,
          }),
        });
        await assertResponseOk(presignResponse);
        const target = (await presignResponse.json()) as UploadTargetResponse;

        if (target.provider === "S3" && target.method === "PUT") {
          const directUpload = await fetch(target.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": draft.file.type },
            body: draft.file,
          });
          if (!directUpload.ok) {
            throw new Error("Could not upload file to storage. Check the S3 bucket CORS settings.");
          }
          storageKey = target.storageKey;
        } else {
          const formData = new FormData();
          formData.set("file", draft.file);
          const uploadResponse = await fetch("/api/uploads", { method: "POST", body: formData });
          await assertResponseOk(uploadResponse);
          storageKey = ((await uploadResponse.json()) as { storageKey: string }).storageKey;
        }

        const noteResponse = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.title.trim(),
            description: draft.description.trim(),
            subject: draft.subject.trim() || "General",
            semester: draft.semester,
            courseCode: draft.courseCode.trim() || "MISC",
            unit: draft.unit.trim(),
            topic: "",
            storageKey,
            tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          }),
        });
        await assertResponseOk(noteResponse);

        setUploadOpen(false);
        setToast("Resource submitted for review");
        void refreshMeta();
        return true;
      } catch (error) {
        if (error instanceof AuthRequiredError) return false;
        setToast(error instanceof Error ? error.message : "Upload failed.");
        return false;
      }
    },
    [assertResponseOk, me, openAuthPrompt, refreshMeta],
  );

  // --- Note detail drawer + actions (shared overlay) ---
  const [openNote, setOpenNote] = useState<ApiNote | null>(null);
  const notePatchListeners = useRef(new Set<NotePatchListener>());

  const subscribeNotePatch = useCallback((listener: NotePatchListener) => {
    notePatchListeners.current.add(listener);
    return () => {
      notePatchListeners.current.delete(listener);
    };
  }, []);

  // Patch the open note locally and broadcast to any mounted note list so
  // optimistic updates stay in sync without a global notes array.
  const patchNote = useCallback((noteId: string, patch: NotePatch) => {
    setOpenNote((current) => (current?.id === noteId ? { ...current, ...patch } : current));
    notePatchListeners.current.forEach((listener) => listener(noteId, patch));
  }, []);

  const openNoteDetail = useCallback((note: ApiNote) => setOpenNote(note), []);

  const toggleSaved = useCallback(
    (note: ApiNote) =>
      requireAuth(async () => {
        const nextSaved = !note.savedByMe;
        patchNote(note.id, { savedByMe: nextSaved });
        try {
          const response = await fetch(`/api/notes/${note.id}/save`, {
            method: nextSaved ? "POST" : "DELETE",
          });
          await assertResponseOk(response);
          void refreshMeta();
        } catch (error) {
          patchNote(note.id, { savedByMe: note.savedByMe });
          if (error instanceof AuthRequiredError) return;
          setToast(error instanceof Error ? error.message : "Could not update saved state.");
        }
      }),
    [assertResponseOk, patchNote, refreshMeta, requireAuth],
  );

  const rateNote = useCallback(
    (note: ApiNote, value: number) =>
      requireAuth(async () => {
        try {
          const response = await fetch(`/api/notes/${note.id}/rating`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value }),
          });
          await assertResponseOk(response);
          const result = (await response.json()) as {
            ratingAverage: number;
            ratingCount: number;
            myRating: number;
          };
          patchNote(note.id, result);
          void refreshMeta();
        } catch (error) {
          if (error instanceof AuthRequiredError) return;
          setToast(error instanceof Error ? error.message : "Could not save rating.");
        }
      }),
    [assertResponseOk, patchNote, refreshMeta, requireAuth],
  );

  const downloadNote = useCallback(
    (note: ApiNote) =>
      requireAuth(async () => {
        try {
          const response = await fetch(`/api/notes/${note.id}/download`, { method: "POST" });
          await assertResponseOk(response);
          const result = (await response.json()) as {
            downloadUrl: string | null;
            downloadCount: number;
          };
          patchNote(note.id, { downloadCount: result.downloadCount });
          void refreshMeta();
          if (result.downloadUrl) {
            window.open(result.downloadUrl, "_blank");
          } else {
            setToast("Download recorded — seeded resource has no file attached.");
          }
        } catch (error) {
          if (error instanceof AuthRequiredError) return;
          setToast(error instanceof Error ? error.message : "Could not download.");
        }
      }),
    [assertResponseOk, patchNote, refreshMeta, requireAuth],
  );

  const reportNote = useCallback(
    (note: ApiNote) =>
      requireAuth(async () => {
        const reason = window.prompt("What should moderators review?")?.trim();
        if (!reason) return;
        try {
          const response = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ noteId: note.id, reason }),
          });
          await assertResponseOk(response);
          setToast("Report sent to moderators");
        } catch (error) {
          if (error instanceof AuthRequiredError) return;
          setToast(error instanceof Error ? error.message : "Could not send report.");
        }
      }),
    [assertResponseOk, requireAuth],
  );

  const signOut = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      await assertResponseOk(response);
      // Full navigation so the cleared cookie applies everywhere.
      window.location.href = "/sign-in";
    } catch (error) {
      if (error instanceof AuthRequiredError) return;
      setToast(error instanceof Error ? error.message : "Sign out failed.");
    }
  }, [assertResponseOk]);

  const saveProfile = useCallback(
    async (input: { name: string; department: string | null; semester: string | null }) => {
      if (!me) {
        openAuthPrompt();
        return;
      }
      try {
        const response = await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await assertResponseOk(response);
        setMe((await response.json()) as ApiUser);
        setToast("Profile updated");
      } catch (error) {
        if (error instanceof AuthRequiredError) return;
        setToast(error instanceof Error ? error.message : "Could not update profile.");
      }
    },
    [assertResponseOk, me, openAuthPrompt],
  );

  const showAuthBanner = authChecked && !me && !authBannerDismissed;

  const value = useMemo<AppShellContextValue>(
    () => ({
      me,
      authChecked,
      meta,
      stats: meta?.stats,
      refreshMeta,
      requireAuth,
      openAuthPrompt,
      openUpload,
      toast,
      setToast,
      showAuthBanner,
      dismissAuthBanner,
      openNoteDetail,
      subscribeNotePatch,
      signOut,
      saveProfile,
    }),
    [
      me,
      authChecked,
      meta,
      refreshMeta,
      requireAuth,
      openAuthPrompt,
      openUpload,
      toast,
      showAuthBanner,
      dismissAuthBanner,
      openNoteDetail,
      subscribeNotePatch,
      signOut,
      saveProfile,
    ],
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}

      {openNote ? (
        <DetailDrawer
          note={openNote}
          onClose={() => setOpenNote(null)}
          onToggleSaved={() => toggleSaved(openNote)}
          onRate={(value) => rateNote(openNote, value)}
          onDownload={() => downloadNote(openNote)}
          onReport={() => reportNote(openNote)}
        />
      ) : null}

      {uploadOpen ? (
        <UploadDialog
          onSubmit={submitUpload}
          onClose={() => setUploadOpen(false)}
          defaultSemester={me?.semester || "1"}
        />
      ) : null}

      {authPromptOpen ? (
        <AuthPromptDialog onClose={() => setAuthPromptOpen(false)} />
      ) : null}

      {toast ? (
        <div className="fixed bottom-20 left-1/2 z-[95] w-max max-w-[90vw] -translate-x-1/2 rounded-md border border-line bg-ink px-4 py-2.5 text-sm font-medium text-surface shadow-lg lg:bottom-6">
          {toast}
        </div>
      ) : null}
    </AppShellContext.Provider>
  );
}
