import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// Publication schedules extraction through after(); run the callback eagerly so
// the suite exercises it instead of dropping it.
vi.mock('next/server', () => ({
  after: (callback: () => unknown) => {
    void callback()
  },
}))

vi.mock('@/lib/notes/search/runner', () => ({
  runNoteExtraction: vi.fn().mockResolvedValue({
    claimed: 0,
    completed: 0,
    failed: 0,
    unsupported: 0,
  }),
}))

const { createClientMock, verifyStoredNoteFileMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  verifyStoredNoteFileMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/notes/storage/supabase-server', () => ({
  verifyStoredNoteFile: verifyStoredNoteFileMock,
}))

import {
  completeNoteUploadAction,
  prepareNoteUploadAction,
} from '@/app/dashboard/notes/new/actions'

function validUploadForm() {
  const data = new FormData()
  data.set('byteSize', '1024')
  data.set('description', 'Clear revision notes')
  data.set('mimeType', 'application/pdf')
  data.set('noteType', 'summary')
  data.set('originalFilename', '../revision.pdf')
  data.set('sha256', 'a'.repeat(64))
  data.set('subjectId', '12')
  data.set('tags', ' Midsem, important, midsem ')
  data.set('title', 'Operating systems revision')
  data.set('visibility', 'public')
  return data
}

function signedStorage() {
  const createSignedUploadUrl = vi.fn().mockResolvedValue({
    data: { token: 'signed-token' },
    error: null,
  })
  const download = vi.fn()
  const remove = vi.fn().mockResolvedValue({ data: [], error: null })
  const from = vi.fn(() => ({ createSignedUploadUrl, download, remove }))

  return { createSignedUploadUrl, download, from, remove }
}

describe('note upload server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid metadata before contacting Supabase', async () => {
    const result = await prepareNoteUploadAction(new FormData())

    expect(result).toMatchObject({ ok: false })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('creates an owner-derived upload intent and signed URL', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          asset_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          note_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          object_key:
            'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/source/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        },
      ],
      error: null,
    })
    const storage = signedStorage()
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: 'student-id' } },
        }),
      },
      rpc,
      storage: { from: storage.from },
    })

    const result = await prepareNoteUploadAction(validUploadForm())

    expect(result).toEqual({
      ok: true,
      prepared: {
        bucket: 'note-files',
        contentType: 'application/pdf',
        noteId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        objectKey:
          'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/source/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        token: 'signed-token',
      },
    })
    expect(rpc).toHaveBeenCalledWith('create_note_upload_draft', {
      p_byte_size: 1024,
      p_description: 'Clear revision notes',
      p_detected_mime_type: 'application/pdf',
      p_note_type: 'summary',
      p_original_filename: 'revision.pdf',
      p_sha256: 'a'.repeat(64),
      p_subject_id: 12,
      p_tags: ['midsem', 'important'],
      p_title: 'Operating systems revision',
      p_visibility: 'public',
    })
  })

  it('requires claims before creating a draft', async () => {
    const rpc = vi.fn()
    const storage = signedStorage()
    createClientMock.mockResolvedValue({
      auth: { getClaims: vi.fn().mockResolvedValue({ data: null }) },
      rpc,
      storage: { from: storage.from },
    })

    const result = await prepareNoteUploadAction(validUploadForm())

    expect(result).toEqual({
      error: 'Your session expired. Sign in and try again.',
      ok: false,
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('verifies uploaded bytes before completing publication', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          note_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          publication_status: 'published',
          published_at: '2026-08-10T00:00:00Z',
        },
      ],
      error: null,
    })
    const storage = signedStorage()
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: 'student-id' } },
        }),
      },
      rpc,
      storage: { from: storage.from },
    })
    verifyStoredNoteFileMock.mockResolvedValue({
      byteSize: 1024,
      mimeType: 'application/pdf',
      sha256: 'a'.repeat(64),
    })

    const result = await completeNoteUploadAction({
      noteId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      objectKey:
        'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/source/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      publish: true,
    })

    expect(result).toEqual({ ok: true, publicationStatus: 'published' })
    expect(rpc).toHaveBeenCalledWith('complete_note_upload', {
      p_note_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      p_publish: true,
      p_verified_byte_size: 1024,
      p_verified_mime_type: 'application/pdf',
      p_verified_sha256: 'a'.repeat(64),
    })
  })

  it('removes a rejected object before discarding its draft intent', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    const storage = signedStorage()
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: 'student-id' } },
        }),
      },
      rpc,
      storage: { from: storage.from },
    })
    verifyStoredNoteFileMock.mockRejectedValue(
      new Error('Use a valid PDF, JPG, PNG, or WebP file.'),
    )

    const result = await completeNoteUploadAction({
      noteId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      objectKey:
        'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/source/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      publish: false,
    })

    expect(result).toEqual({
      error: 'Use a valid PDF, JPG, PNG, or WebP file.',
      ok: false,
    })
    expect(storage.remove).toHaveBeenCalledWith([
      'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/source/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ])
    expect(rpc).toHaveBeenCalledWith('begin_note_upload_discard', {
      p_note_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      p_object_key:
        'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/source/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    })
    expect(rpc).toHaveBeenCalledWith('discard_note_upload_draft', {
      p_note_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    })
  })

  it('does not remove a file when the upload can no longer be cancelled', async () => {
    const rpc = vi.fn().mockImplementation((operation: string) => {
      if (operation === 'begin_note_upload_discard') {
        return Promise.resolve({ data: false, error: null })
      }

      if (operation === 'get_note_upload_status') {
        return Promise.resolve({ data: [], error: null })
      }

      throw new Error(`Unexpected RPC: ${operation}`)
    })
    const storage = signedStorage()
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: 'student-id' } },
        }),
      },
      rpc,
      storage: { from: storage.from },
    })
    verifyStoredNoteFileMock.mockRejectedValue(new Error('Verification failed.'))

    const result = await completeNoteUploadAction({
      noteId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      objectKey:
        'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/source/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      publish: true,
    })

    expect(result).toEqual({ error: 'Verification failed.', ok: false })
    expect(storage.remove).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalledWith('discard_note_upload_draft', {
      p_note_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    })
  })

  it('recovers success when completion committed before its response failed', async () => {
    const rpc = vi.fn().mockImplementation((operation: string) => {
      if (operation === 'complete_note_upload') {
        return Promise.resolve({ data: null, error: { message: 'timeout' } })
      }

      if (operation === 'begin_note_upload_discard') {
        return Promise.resolve({ data: false, error: null })
      }

      if (operation === 'get_note_upload_status') {
        return Promise.resolve({
          data: [
            {
              note_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              processing_status: 'ready',
              publication_status: 'published',
            },
          ],
          error: null,
        })
      }

      throw new Error(`Unexpected RPC: ${operation}`)
    })
    const storage = signedStorage()
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: 'student-id' } },
        }),
      },
      rpc,
      storage: { from: storage.from },
    })
    verifyStoredNoteFileMock.mockResolvedValue({
      byteSize: 1024,
      mimeType: 'application/pdf',
      sha256: 'a'.repeat(64),
    })

    const result = await completeNoteUploadAction({
      noteId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      objectKey:
        'notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/source/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      publish: true,
    })

    expect(result).toEqual({ ok: true, publicationStatus: 'published' })
    expect(storage.remove).not.toHaveBeenCalled()
  })
})
