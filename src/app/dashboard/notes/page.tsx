import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Search, SlidersHorizontal, Upload, X } from 'lucide-react'
import {
  NoteLibraryResults,
  type LibraryNoteItem,
} from '@/components/notes/NoteLibraryResults'
import {
  NOTE_LIBRARY_PAGE_SIZE,
  NOTE_TYPE_LABELS,
  normalizeNoteLibraryQuery,
  noteLibrarySearchParams,
} from '@/lib/notes/library'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type NotesLibraryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type NoteRow = {
  average_rating: string | number | null
  description: string | null
  id: string
  note_type: string
  owner_id: string
  published_at: string | null
  rating_count: number | null
  subject_code: string | null
  subject_name: string | null
  tags: string[]
  title: string
  total_count: number | null
  visibility: string
}

export default async function NotesLibraryPage({
  searchParams,
}: NotesLibraryPageProps) {
  const query = normalizeNoteLibraryQuery(await searchParams)
  const supabase = await createClient()
  const from = (query.page - 1) * NOTE_LIBRARY_PAGE_SIZE

  const [notesResult, subjectsResult] = await Promise.all([
    supabase.rpc('list_notes_for_library', {
      p_access: query.access,
      p_limit: NOTE_LIBRARY_PAGE_SIZE,
      p_note_type: query.noteType,
      p_offset: from,
      p_query: query.query,
      p_sort: query.sort,
      p_subject_id: query.subjectId as number,
    }),
    supabase
      .from('subjects')
      .select('code, id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  if (notesResult.error) {
    throw new Error('The Notes Library could not be loaded.')
  }

  const rawNotes = (notesResult.data || []) as NoteRow[]
  const totalCount = Number(rawNotes[0]?.total_count || 0)
  const noteIds = rawNotes.map((note) => note.id)
  const contributorRows = noteIds.length
    ? ((
        await supabase.rpc('get_accessible_note_contributors', {
          p_note_ids: noteIds,
        })
      ).data ?? [])
    : []

  const contributors = new Map(
    contributorRows.map((contributor) => [
      contributor.note_id,
      contributor.display_name,
    ]),
  )
  const notes: LibraryNoteItem[] = rawNotes.flatMap((note) => {
    if (!note.published_at || !note.subject_name) return []

    return [
      {
        contributorName: contributors.get(note.id) || 'ClassVault student',
        description: note.description,
        id: note.id,
        noteType: note.note_type,
        publishedAt: note.published_at,
        rating:
          note.average_rating === null || note.average_rating === undefined
            ? null
            : Number(note.average_rating),
        ratingCount: Number(note.rating_count || 0),
        subjectCode: note.subject_code,
        subjectName: note.subject_name,
        tags: note.tags,
        title: note.title,
        visibility: note.visibility,
      },
    ]
  })
  const pageCount = Math.max(1, Math.ceil(totalCount / NOTE_LIBRARY_PAGE_SIZE))

  if (query.page > pageCount && totalCount > 0) {
    const params = noteLibrarySearchParams(query, { page: pageCount })
    redirect(`/dashboard/notes${params ? `?${params}` : ''}`)
  }

  const activeFilterCount = [
    query.query,
    query.subjectId,
    query.noteType !== 'all',
    query.access !== 'all',
    query.sort !== 'newest',
  ].filter(Boolean).length

  return (
    <div className="mx-auto max-w-[1320px] space-y-7 sm:space-y-8">
      <section className="flex flex-col gap-5 border-b border-[#cfc4ae] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-black leading-none sm:text-5xl">
            Notes Library
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
            Find trusted notes you can access. Campus-only material appears only
            when your current membership allows it.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 border border-[#171512] bg-[#17453a] px-4 text-sm font-black text-[#fffdf6] shadow-[3px_3px_0_#171512] transition-transform hover:-translate-y-0.5 sm:w-auto"
          href="/dashboard/notes/new"
        >
          <Upload aria-hidden className="h-4 w-4" />
          Upload notes
        </Link>
      </section>

      <form
        className="border border-[#cfc4ae] bg-[#fffdf6] p-4 shadow-[3px_3px_0_rgba(23,21,18,0.08)] sm:p-5"
        method="get"
        role="search"
      >
        <div className="flex items-center gap-2 border-b border-[#ded4c1] pb-3 text-xs font-black uppercase tracking-[0.08em] text-[#17453a]">
          <SlidersHorizontal aria-hidden className="h-4 w-4" />
          Search and filter
          {activeFilterCount > 0 ? (
            <Link
              className="ml-auto inline-flex items-center gap-1 text-[11px] normal-case tracking-normal text-[#171512]/60 underline decoration-[#f0a202] decoration-2 underline-offset-4"
              href="/dashboard/notes"
            >
              <X aria-hidden className="h-3.5 w-3.5" />
              Clear {activeFilterCount}
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.7fr)_minmax(170px,1fr)_minmax(150px,0.8fr)_minmax(140px,0.75fr)_minmax(130px,0.65fr)_auto]">
          <label className="relative block">
            <span className="sr-only">Search note titles</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#171512]/50"
              strokeWidth={1.8}
            />
            <input
              className="h-11 w-full border border-[#bfb39d] bg-[#fdfaf2] pl-10 pr-3 text-sm font-medium outline-none placeholder:text-[#171512]/40 focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
              defaultValue={query.query}
              name="q"
              placeholder="Search note titles…"
              type="search"
            />
          </label>

          <label>
            <span className="sr-only">Subject</span>
            <select
              className="h-11 w-full border border-[#bfb39d] bg-[#fdfaf2] px-3 text-sm font-semibold outline-none focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
              defaultValue={query.subjectId || ''}
              name="subject"
            >
              <option value="">All subjects</option>
              {(subjectsResult.data || []).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code ? `${subject.code} · ` : ''}
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Note type</span>
            <select
              className="h-11 w-full border border-[#bfb39d] bg-[#fdfaf2] px-3 text-sm font-semibold outline-none focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
              defaultValue={query.noteType}
              name="type"
            >
              <option value="all">All note types</option>
              {Object.entries(NOTE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Access scope</span>
            <select
              className="h-11 w-full border border-[#bfb39d] bg-[#fdfaf2] px-3 text-sm font-semibold outline-none focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
              defaultValue={query.access}
              name="access"
            >
              <option value="all">All access</option>
              <option value="public">Public</option>
              <option value="university">Campus</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Sort order</span>
            <select
              className="h-11 w-full border border-[#bfb39d] bg-[#fdfaf2] px-3 text-sm font-semibold outline-none focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
              defaultValue={query.sort}
              name="sort"
            >
              <option value="newest">Newest first</option>
              <option value="top">Top rated</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>

          <button
            className="inline-flex h-11 items-center justify-center bg-[#171512] px-5 text-sm font-black text-[#fffdf6] transition-colors hover:bg-[#17453a]"
            type="submit"
          >
            Apply
          </button>
        </div>
      </form>

      <NoteLibraryResults
        notes={notes}
        pageCount={pageCount}
        query={query}
        totalCount={totalCount}
      />
    </div>
  )
}
