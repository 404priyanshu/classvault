"use client";

import { AnimatePresence, motion } from "motion/react";
import { FileText, RefreshCw, Search } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ApiNote, NotesResponse } from "@/lib/api-types";
import { useAppShell } from "@/components/app-shell/app-shell-context";

export function SearchCommandPalette() {
  const { meta, openNoteDetail } = useAppShell();
  const subjects = meta?.subjects ?? [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [results, setResults] = useState<ApiNote[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "8" });
    if (query.trim()) params.set("q", query.trim());
    if (activeFilter) params.set("subject", activeFilter);

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/notes?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as NotesResponse;
        setResults(data.items);
        setActiveIndex(0);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, query ? 200 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query, activeFilter]);

  function openPalette() {
    setQuery("");
    setActiveFilter(null);
    setActiveIndex(0);
    setOpen(true);
  }

  function selectResult(note: ApiNote) {
    setOpen(false);
    openNoteDetail(note);
  }

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => {
          if (!current) {
            setQuery("");
            setActiveFilter(null);
            setActiveIndex(0);
          }
          return !current;
        });
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      selectResult(results[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="flex h-9 w-full min-w-0 items-center gap-2.5 rounded-md border border-line bg-surface px-3 text-left text-sm text-ink-faint transition hover:border-line-strong hover:text-ink-soft sm:w-72"
        aria-label="Search resources"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">Search resources...</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink-faint sm:inline-flex">
          Ctrl K
        </kbd>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-start justify-center bg-black/25 px-3 py-4 backdrop-blur-[2px] sm:px-4 sm:py-28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search resources"
              className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-hidden rounded-lg border border-line bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.14),0_4px_18px_rgba(0,0,0,0.06)]"
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                {searching ? (
                  <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-ink-faint" />
                ) : (
                  <Search className="h-4 w-4 shrink-0 text-ink-faint" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Search notes, PYQs, subjects..."
                  className="h-8 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
                />
                <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink-faint">
                  esc
                </kbd>
              </div>

              {subjects.length ? (
                <div className="flex gap-1.5 overflow-x-auto border-b border-line px-4 py-2.5">
                  {subjects.map((filter) => {
                    const selected = activeFilter === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setActiveFilter(selected ? null : filter);
                          inputRef.current?.focus();
                        }}
                        className={
                          selected
                            ? "shrink-0 rounded-md border border-ink bg-ink px-2.5 py-1 text-xs font-medium text-surface"
                            : "shrink-0 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
                        }
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="max-h-[min(50vh,420px)] overflow-y-auto p-2">
                {results.length ? (
                  <div className="space-y-0.5">
                    {results.map((note, index) => (
                      <button
                        key={note.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => selectResult(note)}
                        className={`flex w-full items-center gap-3 rounded-md border px-2.5 py-2.5 text-left transition ${
                          index === activeIndex ? "border-line bg-paper" : "border-transparent"
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-soft">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {note.title}
                          </span>
                          <span className="block truncate text-xs text-ink-faint">
                            {note.subject} &middot; Sem {note.semester} &middot; {note.courseCode}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                          {note.fileType}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-line bg-paper px-4 py-10 text-center">
                    <p className="text-sm font-medium text-ink">
                      {searching ? "Searching..." : "No matching resources"}
                    </p>
                    {!searching ? (
                      <p className="mt-1 text-xs text-ink-faint">
                        Try a different subject, course code, or tag.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
