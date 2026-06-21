"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Sparkles, X } from "lucide-react";
import { cx } from "@/lib/cx";

export type UploadDraft = {
  title: string;
  subject: string;
  semester: string;
  courseCode: string;
  unit: string;
  tags: string;
  description: string;
  file: File | null;
};

const emptyDraft: UploadDraft = {
  title: "",
  subject: "",
  semester: "5",
  courseCode: "",
  unit: "",
  tags: "",
  description: "",
  file: null,
};

export function AuthPreviewBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-line bg-surface p-3 transition hover:border-line-strong sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-ink-soft">
        Preview mode is on. Sign in to save, rate, download, upload, and personalize resources.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/sign-in"
          className="inline-flex h-8 items-center rounded-md bg-ink px-3 text-sm font-medium text-surface transition hover:-translate-y-0.5 hover:bg-ink/85"
        >
          Sign in
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper hover:text-ink"
          aria-label="Dismiss sign-in prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AuthPromptDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/25 p-3 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close sign-in prompt"
      />
      <section className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-surface transition duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase text-ink-faint">
              Account required
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">Sign in to continue</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm leading-6 text-ink-soft">
            You can keep browsing resources in preview mode. Sign in when you want to save,
            rate, download, upload, or manage your profile.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link
              href="/sign-in"
              className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:-translate-y-0.5 hover:bg-ink/85"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center justify-center rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function UploadDialog({
  onSubmit,
  onClose,
  defaultSemester = "1",
}: {
  onSubmit: (draft: UploadDraft) => Promise<boolean>;
  onClose: () => void;
  defaultSemester?: string;
}) {
  const [draft, setDraft] = useState<UploadDraft>(() => ({
    ...emptyDraft,
    semester: defaultSemester,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || submitting) return;
      event.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  function update<K extends keyof UploadDraft>(key: K, value: UploadDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(draft);
    if (!ok) setSubmitting(false);
  }

  async function suggestWithAi() {
    if (aiLoading) return;
    if (draft.title.trim().length < 3 || !draft.subject.trim() || !draft.courseCode.trim()) {
      setAiError("Add a title, subject, and course code first.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai/note-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          subject: draft.subject,
          courseCode: draft.courseCode,
          unit: draft.unit,
          fileName: draft.file?.name ?? "",
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        setAiError(body?.error?.message ?? "Could not generate suggestions.");
        return;
      }
      const data = (await response.json()) as { description: string; tags: string[] };
      setDraft((current) => ({
        ...current,
        description: data.description,
        tags: data.tags.join(", ") || current.tags,
      }));
    } catch {
      setAiError("Could not generate suggestions.");
    } finally {
      setAiLoading(false);
    }
  }

  const inputClasses =
    "h-9 rounded-md border border-line bg-surface px-3 text-sm outline-none transition placeholder:text-ink-faint hover:border-line-strong focus:border-ink-faint";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-3 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-line bg-surface"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Upload resource</h2>
            <p className="mt-0.5 text-sm text-ink-faint">PDF, DOCX, PPTX, or ZIP up to 25 MB. Submissions go to review.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper hover:text-ink"
            aria-label="Close upload dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            File
            <input
              required
              type="file"
              accept=".pdf,.docx,.pptx,.zip"
              onChange={(event) => update("file", event.target.files?.[0] ?? null)}
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft outline-none transition file:mr-3 file:rounded file:border-0 file:bg-ink file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-surface hover:border-line-strong"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Title
            <input
              required
              minLength={3}
              maxLength={120}
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="DBMS – Unit 3 Notes"
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Subject
            <input
              required
              value={draft.subject}
              onChange={(event) => update("subject", event.target.value)}
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Course code
            <input
              required
              value={draft.courseCode}
              onChange={(event) => update("courseCode", event.target.value)}
              placeholder="CS302"
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Semester
            <select
              value={draft.semester}
              onChange={(event) => update("semester", event.target.value)}
              className={cx(inputClasses, "appearance-none")}
            >
              {["1", "2", "3", "4", "5", "6", "7", "8"].map((item) => (
                <option key={item} value={item}>
                  Semester {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Unit
            <input
              value={draft.unit}
              onChange={(event) => update("unit", event.target.value)}
              placeholder="Unit 3"
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Tags
            <input
              value={draft.tags}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="DBMS, SQL, PYQ"
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            <span className="flex items-center justify-between gap-2">
              <span>Description</span>
              <button
                type="button"
                onClick={suggestWithAi}
                disabled={aiLoading}
                className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-0.5 text-xs font-medium text-ink-soft transition hover:border-line-strong hover:text-ink disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading ? "Generating…" : "Suggest with AI"}
              </button>
            </span>
            <textarea
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
              rows={3}
              placeholder="Write a short summary, or let AI draft it from the fields above."
              className="resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-ink-faint hover:border-line-strong focus:border-ink-faint"
            />
            {aiError ? (
              <span className="text-[11px] font-normal text-red-600">{aiError}</span>
            ) : (
              <span className="text-[11px] font-normal text-ink-faint">
                AI fills the description and tags — review before submitting.
              </span>
            )}
          </label>
        </div>

        <div className="grid gap-2 border-t border-line p-4 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center justify-center rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-60"
          >
            {submitting ? "Uploading..." : "Submit for review"}
          </button>
        </div>
      </form>
    </div>
  );
}
