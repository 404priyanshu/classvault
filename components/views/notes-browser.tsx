"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiNote, NotesResponse } from "@/lib/api-types";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import {
  FilterBar,
  NoteCollection,
  type LayoutMode,
} from "@/components/notes/note-ui";

type NotesScope = "library" | "saved";

const EMPTY_HINT: Record<NotesScope, string> = {
  library: "Try clearing a filter or searching for another course.",
  saved: "Resources you bookmark will collect here.",
};

export function NotesBrowser({ scope }: { scope: NotesScope }) {
  const { meta, openNoteDetail, openAuthPrompt, subscribeNotePatch } = useAppShell();

  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState("All");
  const [subject, setSubject] = useState("All");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("list");
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  const refetch = useCallback(() => setRefetchTick((tick) => tick + 1), []);

  // Per-route notes fetch — each scope owns its own query params.
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (semester !== "All") params.set("semester", semester);
    if (subject !== "All") params.set("subject", subject);
    if (scope === "saved") params.set("saved", "true");

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/notes?${params}`, { signal: controller.signal });
        if (response.status === 401) {
          openAuthPrompt();
          setNotes([]);
          setLoadError(null);
          return;
        }
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const data = (await response.json()) as NotesResponse;
        setNotes(data.items);
        setLoadError(null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Failed to load resources.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 300 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [scope, query, semester, subject, refetchTick, openAuthPrompt]);

  // Apply optimistic patches from the shared note actions.
  useEffect(
    () =>
      subscribeNotePatch((noteId, patch) => {
        setNotes((current) => {
          // On the saved view, unsaving removes the note from the list.
          if (scope === "saved" && patch.savedByMe === false) {
            return current.filter((note) => note.id !== noteId);
          }
          return current.map((note) => (note.id === noteId ? { ...note, ...patch } : note));
        });
      }),
    [scope, subscribeNotePatch],
  );

  return (
    <>
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        semester={semester}
        semesters={["All", ...(meta?.semesters ?? [])]}
        onSemesterChange={setSemester}
        subject={subject}
        subjects={["All", ...(meta?.subjects ?? [])]}
        onSubjectChange={setSubject}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        onReset={() => {
          setQuery("");
          setSemester("All");
          setSubject("All");
        }}
        count={notes.length}
      />
      <NoteCollection
        notes={notes}
        loading={loading}
        loadError={loadError}
        onRetry={refetch}
        layoutMode={layoutMode}
        onOpenNote={openNoteDetail}
        emptyHint={EMPTY_HINT[scope]}
      />
    </>
  );
}
