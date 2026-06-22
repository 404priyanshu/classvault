import {
  ChevronDown,
  Clock,
  Grid2X2,
  List,
  Search,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/lib/cx";
import type { LayoutMode, NoteSort } from "@/components/notes/note-primitives";

export function FilterBar({
  query,
  onQueryChange,
  semester,
  semesters,
  onSemesterChange,
  subject,
  subjects,
  onSubjectChange,
  sort = "recent",
  onSortChange,
  showSort = false,
  layoutMode,
  onLayoutModeChange,
  onReset,
  count,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  semester: string;
  semesters: string[];
  onSemesterChange: (value: string) => void;
  subject: string;
  subjects: string[];
  onSubjectChange: (value: string) => void;
  sort?: NoteSort;
  onSortChange?: (value: NoteSort) => void;
  showSort?: boolean;
  layoutMode: LayoutMode;
  onLayoutModeChange: (value: LayoutMode) => void;
  onReset: () => void;
  count: number;
}) {
  const filtersActive = query !== "" || semester !== "All" || subject !== "All" || (showSort && sort !== "recent");

  return (
    <div className="flex min-w-0 flex-col gap-2 pb-4 sm:flex-row sm:flex-wrap sm:items-center">
      <label className="relative min-w-0 flex-1 sm:max-w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filter by title, tag, code…"
          className="h-9 w-full rounded-md border border-line bg-surface pl-8 pr-3 text-sm outline-none transition placeholder:text-ink-faint hover:border-line-strong focus:border-ink-faint"
        />
      </label>
      <FilterSelect label="Semester" value={semester} options={semesters} onChange={onSemesterChange} />
      <FilterSelect label="Subject" value={subject} options={subjects} onChange={onSubjectChange} />
      {showSort && onSortChange ? (
        <div className="inline-flex h-9 rounded-md border border-line bg-surface p-0.5">
          {(
            [
              ["recent", "Recent", Clock],
              ["trending", "Trending", TrendingUp],
            ] as Array<[NoteSort, string, LucideIcon]>
          ).map(([mode, label, Icon]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSortChange(mode)}
              aria-pressed={sort === mode}
              className={cx(
                "inline-flex items-center gap-1.5 rounded px-2.5 text-xs font-semibold text-ink-faint transition",
                sort === mode && "bg-paper text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {filtersActive ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center rounded-md px-2.5 text-sm font-medium text-ink-soft transition hover:text-ink"
        >
          Clear
        </button>
      ) : null}
      <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-start">
        <span className="font-mono text-xs text-ink-faint">{count} results</span>
        <div className="inline-flex rounded-md border border-line bg-surface p-0.5">
          {(
            [
              ["list", List],
              ["grid", Grid2X2],
            ] as Array<[LayoutMode, LucideIcon]>
          ).map(([mode, Icon]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onLayoutModeChange(mode)}
              className={cx(
                "inline-flex h-7 w-7 items-center justify-center rounded text-ink-faint transition",
                layoutMode === mode && "bg-paper text-ink",
              )}
              aria-label={`${mode} layout`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-line bg-surface pl-3 pr-8 text-sm font-medium text-ink-soft outline-none transition hover:border-line-strong focus:border-ink-faint sm:w-auto"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? label : option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
    </label>
  );
}
