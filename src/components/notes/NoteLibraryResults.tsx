import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  Globe2,
  SearchX,
  ShieldCheck,
  Star,
} from 'lucide-react'
import {
  formatNoteType,
  noteLibrarySearchParams,
  type NoteLibraryQuery,
} from '@/lib/notes/library'

export type LibraryNoteItem = {
  contributorName: string
  description: string | null
  extractionStatus: string
  id: string
  noteType: string
  publishedAt: string
  rating: number | null
  ratingCount: number
  searchSnippet: string | null
  subjectCode: string | null
  subjectName: string
  tags: string[]
  title: string
  visibility: string
}

function plainSearchSnippet(value: string) {
  return value.replace(/<\/?mark>/gi, '')
}

type NoteLibraryResultsProps = {
  notes: LibraryNoteItem[]
  pageCount: number
  query: NoteLibraryQuery
  totalCount: number
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function NoteRow({ note }: { note: LibraryNoteItem }) {
  const isCampusNote = note.visibility === 'university'

  return (
    <article className="group relative border-b border-[#d9cfbc] last:border-b-0">
      <Link
        aria-label={`Open ${note.title}`}
        className="grid gap-4 px-4 py-5 outline-none transition-colors hover:bg-[#f8f2e5] focus-visible:bg-[#f8f2e5] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#17453a] sm:grid-cols-[104px_minmax(0,1fr)_150px] sm:gap-5 sm:px-5 lg:px-6"
        href={`/dashboard/notes/${note.id}`}
      >
        <div className="bg-ruled relative hidden h-[118px] overflow-hidden border border-[#bfb39d] bg-[#f1eadb] sm:block">
          <span className="absolute left-0 top-0 h-full w-2 bg-[#f0a202]" />
          <FileText
            aria-hidden
            className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-[#17453a]"
            strokeWidth={1.45}
          />
          <span className="absolute bottom-2 right-2 bg-[#fffdf6] px-1.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#17453a]">
            {note.subjectCode || 'Notes'}
          </span>
        </div>

        <div className="min-w-0 self-center">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#17453a]">
            <span>{note.subjectCode || note.subjectName}</span>
            <span aria-hidden className="text-[#171512]/25">
              /
            </span>
            <span className="text-[#171512]/55">
              {formatNoteType(note.noteType)}
            </span>
          </div>
          <h2 className="font-display mt-1.5 text-xl font-black leading-tight text-[#171512] transition-colors group-hover:text-[#17453a] sm:text-[1.35rem]">
            {note.title}
          </h2>
          {note.description ? (
            <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-[#171512]/60">
              {note.description}
            </p>
          ) : null}
          {note.searchSnippet ? (
            <p className="mt-2 line-clamp-2 border-l-2 border-[#f0a202] pl-2 text-xs leading-relaxed text-[#171512]/65">
              Match: {plainSearchSnippet(note.searchSnippet)}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#171512]/55">
            <span>by {note.contributorName}</span>
            <span aria-hidden className="h-1 w-1 bg-[#171512]/25" />
            <time dateTime={note.publishedAt}>
              {dateFormatter.format(new Date(note.publishedAt))}
            </time>
            {note.tags.slice(0, 2).map((tag) => (
              <span
                className="border border-[#cfc4ae] bg-[#fffdf6] px-2 py-0.5 text-[10px] font-semibold text-[#171512]/65"
                key={tag}
              >
                #{tag}
              </span>
            ))}
            {note.extractionStatus === 'unsupported' || note.extractionStatus === 'failed' ? (
              <span className="text-[#b56d00]">Text search limited</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#e1d8c6] pt-3 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17453a]">
            {isCampusNote ? (
              <Building2 aria-hidden className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <Globe2 aria-hidden className="h-4 w-4" strokeWidth={1.8} />
            )}
            {isCampusNote ? 'Campus' : 'Public'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-black text-[#171512]">
            <Star
              aria-hidden
              className="h-4 w-4 fill-[#f0a202] text-[#b56d00]"
              strokeWidth={1.5}
            />
            {note.rating === null ? 'Unrated' : note.rating.toFixed(1)}
            {note.ratingCount > 0 ? (
              <span className="font-normal text-[#171512]/45">
                ({note.ratingCount})
              </span>
            ) : null}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-[#17453a]">
            Open note
            <ArrowRight
              aria-hidden
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </article>
  )
}
export function NoteLibraryResults({
  notes,
  pageCount,
  query,
  totalCount,
}: NoteLibraryResultsProps) {
  return (
    <section aria-labelledby="library-results-heading">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2
            className="font-display text-2xl font-black"
            id="library-results-heading"
          >
            Available notes
          </h2>
          <p aria-live="polite" className="mt-1 text-xs text-[#171512]/55">
            {totalCount === 1 ? '1 note' : `${totalCount} notes`} within your
            current access
          </p>
        </div>
        <span className="hidden items-center gap-1.5 text-xs font-bold text-[#17453a] sm:inline-flex">
          <ShieldCheck aria-hidden className="h-4 w-4" />
          RLS protected
        </span>
      </div>

      <div className="overflow-hidden border border-[#cfc4ae] bg-[#fffdf6] [box-shadow:var(--elev-inline)]">
        {notes.length > 0 ? (
          notes.map((note) => <NoteRow key={note.id} note={note} />)
        ) : (
          <div className="bg-ruled grid min-h-[360px] place-items-center px-6 py-12 text-center">
            <div className="max-w-md">
              <SearchX
                aria-hidden
                className="mx-auto h-10 w-10 text-[#17453a]"
                strokeWidth={1.45}
              />
              <h3 className="font-display mt-4 text-2xl font-black">
                No notes match this shelf
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#171512]/60">
                Try clearing a filter or searching with fewer words. Notes you
                cannot access remain hidden by the database.
              </p>
              <Link
                className="mt-5 inline-flex min-h-10 items-center border border-[#171512] bg-[#17453a] px-4 text-sm font-black text-[#fffdf6] [box-shadow:var(--elev-inline)]"
                href="/dashboard/notes"
              >
                Clear all filters
              </Link>
            </div>
          </div>
        )}
      </div>

      {pageCount > 1 ? (
        <nav
          aria-label="Notes pagination"
          className="mt-5 flex items-center justify-between gap-4"
        >
          {query.page > 1 ? (
            <Link
              className="inline-flex min-h-10 items-center gap-2 border border-[#bfb39d] bg-[#fffdf6] px-3 text-xs font-black text-[#17453a] hover:border-[#17453a]"
              href={`/dashboard/notes?${noteLibrarySearchParams(query, {
                page: query.page - 1,
              })}`}
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs font-semibold text-[#171512]/55">
            Page {query.page} of {pageCount}
          </span>
          {query.page < pageCount ? (
            <Link
              className="inline-flex min-h-10 items-center gap-2 border border-[#bfb39d] bg-[#fffdf6] px-3 text-xs font-black text-[#17453a] hover:border-[#17453a]"
              href={`/dashboard/notes?${noteLibrarySearchParams(query, {
                page: query.page + 1,
              })}`}
            >
              Next
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  )
}
