import { describe, expect, it } from 'vitest'
import {
  formatFileSize,
  normalizeNoteLibraryQuery,
  noteLibrarySearchParams,
} from '@/lib/notes/library'

describe('normalizeNoteLibraryQuery', () => {
  it('uses stable defaults for an empty query', () => {
    expect(normalizeNoteLibraryQuery({})).toEqual({
      access: 'all',
      noteType: 'all',
      page: 1,
      query: '',
      sort: 'newest',
      subjectId: null,
    })
  })

  it('accepts supported filters and ignores invalid values', () => {
    expect(
      normalizeNoteLibraryQuery({
        access: 'university',
        page: '3',
        q: '  operating   systems  ',
        sort: 'oldest',
        subject: '42',
        type: 'summary',
      }),
    ).toEqual({
      access: 'university',
      noteType: 'summary',
      page: 3,
      query: 'operating systems',
      sort: 'oldest',
      subjectId: 42,
    })

    expect(
      normalizeNoteLibraryQuery({
        access: 'private',
        page: '-2',
        subject: 'not-a-number',
        type: 'slides',
      }),
    ).toMatchObject({
      access: 'all',
      noteType: 'all',
      page: 1,
      subjectId: null,
    })
  })

  it('removes PostgREST filter syntax from title searches', () => {
    expect(normalizeNoteLibraryQuery({ q: 'dbms,(title)%_' }).query).toBe(
      'dbms title _',
    )
  })

  it('accepts the recency-weighted top sort and rejects unknown sorts', () => {
    expect(normalizeNoteLibraryQuery({ sort: 'top' }).sort).toBe('top')
    expect(normalizeNoteLibraryQuery({ sort: 'rating' }).sort).toBe('newest')
  })
})
describe('noteLibrarySearchParams', () => {
  it('omits default values and resets pagination through an override', () => {
    const query = normalizeNoteLibraryQuery({
      access: 'public',
      page: '4',
      q: 'DBMS',
      type: 'pyq',
    })

    expect(noteLibrarySearchParams(query, { page: 1 })).toBe(
      'q=DBMS&type=pyq&access=public',
    )
  })
})

describe('formatFileSize', () => {
  it('formats kilobytes and megabytes for note metadata', () => {
    expect(formatFileSize(512)).toBe('1 KB')
    expect(formatFileSize(1024 * 1024 * 2.25)).toBe('2.3 MB')
  })
})
