import { describe, expect, it, vi } from 'vitest'

// The hook module reaches the server actions, which pull in server-only code
// through the extraction runner. Only the pure row builder is under test here.
vi.mock('server-only', () => ({}))
vi.mock('@/lib/notes/search/runner', () => ({ runNoteExtraction: vi.fn() }))
vi.mock('next/server', () => ({ after: (fn: () => unknown) => void fn() }))

import { createBatchRows } from '@/components/notes/upload/use-batch-upload'

const MAX_BYTES = 25 * 1024 * 1024

function fileOf(name: string, bytes: number) {
  return new File([new Uint8Array(bytes)], name, { type: 'application/pdf' })
}

describe('createBatchRows', () => {
  it('titles every accepted file from its filename', () => {
    const { rejected, rows } = createBatchRows([
      fileOf('DBMS Unit 3 Indexing.pdf', 64),
      fileOf('os_unit-2_paging.pdf', 64),
    ])

    expect(rejected).toEqual([])
    expect(rows.map((row) => row.title)).toEqual([
      'DBMS Unit 3 Indexing',
      'os unit 2 paging',
    ])
    expect(rows.every((row) => row.status === 'queued')).toBe(true)
    expect(rows.every((row) => row.error === null)).toBe(true)
  })

  it('gives each row an id of its own so removals target one file', () => {
    const { rows } = createBatchRows([
      fileOf('Notes.pdf', 64),
      fileOf('Notes.pdf', 64),
    ])

    expect(rows).toHaveLength(2)
    expect(rows[0].id).not.toBe(rows[1].id)
  })

  it('rejects oversized and empty files without dropping the good ones', () => {
    const { rejected, rows } = createBatchRows([
      fileOf('Good notes.pdf', 128),
      fileOf('Huge scan.pdf', MAX_BYTES + 1),
      fileOf('Empty.pdf', 0),
    ])

    expect(rows.map((row) => row.title)).toEqual(['Good notes'])
    expect(rejected.map((entry) => entry.name)).toEqual([
      'Huge scan.pdf',
      'Empty.pdf',
    ])
    expect(rejected[0].reason).toMatch(/25 MiB/)
  })

  it('leaves an untitleable file blank rather than inventing a title', () => {
    const { rows } = createBatchRows([fileOf('IMG_1234.jpg', 64)])

    expect(rows).toHaveLength(1)
    expect(rows[0].title).toBe('')
  })
})
