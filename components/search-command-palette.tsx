"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BookOpenCheck,
  FileText,
  FolderSearch,
  GraduationCap,
  Search,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

type SearchResult = {
  id: string;
  title: string;
  subject: string;
  semester: string;
  type: string;
  icon: typeof FileText;
};

const quickFilters = [
  "Notes",
  "PYQs",
  "Assignments",
  "Semester 1",
  "DBMS",
  "Blockchain",
  "Computer Networks",
];

const mockResults: SearchResult[] = [
  {
    id: "dbms-normalization",
    title: "DBMS Unit 2 Normalization Notes",
    subject: "DBMS",
    semester: "Semester 5",
    type: "Notes",
    icon: BookOpenCheck,
  },
  {
    id: "blockchain-contracts",
    title: "Blockchain CSET605 Smart Contracts",
    subject: "Blockchain",
    semester: "Semester 6",
    type: "Notes",
    icon: Sparkles,
  },
  {
    id: "cn-pyq",
    title: "Computer Networks Previous Year Questions",
    subject: "Computer Networks",
    semester: "Semester 4",
    type: "PYQs",
    icon: FolderSearch,
  },
  {
    id: "os-deadlock",
    title: "OS Deadlock Notes",
    subject: "Operating Systems",
    semester: "Semester 4",
    type: "Notes",
    icon: FileText,
  },
  {
    id: "sda-assignment",
    title: "Software Design Architecture Assignment",
    subject: "Software Design",
    semester: "Semester 5",
    type: "Assignments",
    icon: GraduationCap,
  },
];

type SearchCommandPaletteProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function SearchCommandPalette({
  query,
  onQueryChange,
}: SearchCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [modalQuery, setModalQuery] = useState(query);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredResults = useMemo(() => {
    const normalizedQuery = modalQuery.trim().toLowerCase();
    const normalizedFilter = activeFilter?.toLowerCase();

    return mockResults.filter((result) => {
      const resultText = [
        result.title,
        result.subject,
        result.semester,
        result.type,
      ]
        .join(" ")
        .toLowerCase();
      const queryMatch = !normalizedQuery || resultText.includes(normalizedQuery);
      const filterMatch =
        !normalizedFilter ||
        resultText.includes(normalizedFilter) ||
        (normalizedFilter === "semester 1" && result.semester === "Semester 1");

      return queryMatch && filterMatch;
    });
  }, [activeFilter, modalQuery]);

  function openPalette() {
    setModalQuery(query);
    setActiveIndex(0);
    setOpen(true);
  }

  function closePalette() {
    setOpen(false);
  }

  function selectResult(result: SearchResult) {
    // TODO: connect this to real search/result routing when backend search lands.
    onQueryChange(result.title);
    setModalQuery(result.title);
    closePalette();
  }

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (isShortcut) {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        closePalette();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, Math.max(filteredResults.length - 1, 0)),
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter" && filteredResults[activeIndex]) {
      event.preventDefault();
      selectResult(filteredResults[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="classvault-search-trigger group flex h-10 w-full min-w-0 items-center gap-3 rounded-2xl px-3.5 text-left text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 sm:w-72"
        aria-label="Open ClassVault search"
      >
        <Search className="classvault-search-trigger-icon h-4 w-4 shrink-0 transition" />
        <span
          className="min-w-0 flex-1 truncate"
          style={{ color: query ? "var(--cv-search-text)" : "var(--cv-search-placeholder)" }}
        >
          {query || "Search notes, PYQs, assignments..."}
        </span>
        <span className="classvault-search-kbd" aria-hidden="true">
          <span>⌘</span>
          <span className="opacity-70">+</span>
          <span>K</span>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="classvault-search-modal-overlay fixed inset-0 z-[90] flex items-start justify-center px-4 py-20 sm:py-28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closePalette();
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="classvault-search-title"
              className="classvault-search-modal w-full max-w-2xl overflow-hidden rounded-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="classvault-search-modal-header">
                <Search className="classvault-search-modal-icon" />
                <label id="classvault-search-title" className="sr-only">
                  Search ClassVault resources
                </label>
                <input
                  ref={inputRef}
                  value={modalQuery}
                  onChange={(event) => {
                    setModalQuery(event.target.value);
                    onQueryChange(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Search notes, PYQs, assignments, subjects..."
                  className="classvault-search-modal-input"
                />
                <kbd className="classvault-search-modal-kbd">Esc</kbd>
              </div>

              <div className="classvault-search-modal-filters">
                <div className="classvault-search-modal-filters-row">
                  {quickFilters.map((filter) => {
                    const selected = activeFilter === filter;

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setActiveFilter(selected ? null : filter);
                          setActiveIndex(0);
                        }}
                        className={[
                          "classvault-search-filter",
                          selected ? "is-active" : "",
                        ].join(" ")}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="classvault-search-modal-results">
                <p className="classvault-search-modal-section-label">
                  Suggested resources
                </p>
                {filteredResults.length ? (
                  <div className="space-y-1">
                    {filteredResults.map((result, index) => {
                      const Icon = result.icon;
                      const active = index === activeIndex;

                      return (
                        <button
                          key={result.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectResult(result)}
                          className={[
                            "classvault-search-result",
                            active ? "is-active" : "",
                          ].join(" ")}
                        >
                          <span className="classvault-search-result-icon">
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="classvault-search-result-title">
                              {result.title}
                            </span>
                            <span className="classvault-search-result-meta">
                              {result.subject} · {result.semester} · {result.type}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="classvault-search-modal-empty">
                    <p className="classvault-search-modal-empty-title">No mock results found</p>
                    <p className="classvault-search-modal-empty-text">
                      TODO: connect this empty state to real Supabase search suggestions.
                    </p>
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
