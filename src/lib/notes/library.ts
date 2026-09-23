export const NOTE_LIBRARY_PAGE_SIZE = 10

export const NOTE_TYPE_LABELS = {
  lecture_notes: 'Lecture notes',
  summary: 'Summary',
  pyq: 'Past-year paper',
  solution: 'Solution',
  lab: 'Lab notes',
  other: 'Other',
} as const

export type NoteType = keyof typeof NOTE_TYPE_LABELS
export type NoteAccess = 'all' | 'public' | 'university'
export type NoteSort = 'newest' | 'oldest' | 'top'

export type NoteLibraryQuery = {
  access: NoteAccess
  noteType: NoteType | 'all'
  page: number
  query: string
  sort: NoteSort
  subjectId: number | null
}

type RawSearchParams = Record<string, string | string[] | undefined>

const NOTE_TYPES = new Set<NoteType>(
  Object.keys(NOTE_TYPE_LABELS) as NoteType[],
)

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function normalizeNoteLibraryQuery(
  searchParams: RawSearchParams,
): NoteLibraryQuery {
  const rawPage = Number.parseInt(firstValue(searchParams.page) || '1', 10)
  const rawSubject = Number.parseInt(
    firstValue(searchParams.subject) || '',
    10,
  )
  const rawType = firstValue(searchParams.type)
  const rawAccess = firstValue(searchParams.access)
  const rawSort = firstValue(searchParams.sort)

  return {
    access:
      rawAccess === 'public' || rawAccess === 'university'
        ? rawAccess
        : 'all',
    noteType:
      rawType && NOTE_TYPES.has(rawType as NoteType)
        ? (rawType as NoteType)
        : 'all',
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.min(rawPage, 9999) : 1,
    query: (firstValue(searchParams.q) || '')
      .replace(/[,%()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80),
    sort:
      rawSort === 'oldest' || rawSort === 'top' ? rawSort : 'newest',
    subjectId:
      Number.isSafeInteger(rawSubject) && rawSubject > 0 ? rawSubject : null,
  }
}

export function noteLibrarySearchParams(
  query: NoteLibraryQuery,
  overrides: Partial<NoteLibraryQuery> = {},
) {
  const value = { ...query, ...overrides }
  const params = new URLSearchParams()

  if (value.query) params.set('q', value.query)
  if (value.subjectId) params.set('subject', String(value.subjectId))
  if (value.noteType !== 'all') params.set('type', value.noteType)
  if (value.access !== 'all') params.set('access', value.access)
  if (value.sort !== 'newest') params.set('sort', value.sort)
  if (value.page > 1) params.set('page', String(value.page))

  return params.toString()
}

export function formatNoteType(value: string) {
  return NOTE_TYPE_LABELS[value as NoteType] || 'Other'
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const NOTE_TITLE_MAX_LENGTH = 180

/**
 * A title to start an upload with, carried over from a search that found
 * nothing. Only ever a starting value in the form: the student edits it and
 * the server validates it like any other title.
 */
export function uploadTitleFromSearch(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const title = (raw ?? '').replace(/\s+/g, ' ').trim()
  return title.slice(0, NOTE_TITLE_MAX_LENGTH)
}

/** Where a search that found nothing sends the student to share the note. */
export function uploadHrefForSearch(query: string) {
  const title = uploadTitleFromSearch(query)
  return title
    ? `/dashboard/notes/new?${new URLSearchParams({ title })}`
    : '/dashboard/notes/new'
}
