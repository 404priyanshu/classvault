import { describe, expect, it, vi } from 'vitest'
import {
  NoteUploadCompletionPendingError,
  settleNoteUploadCompletion,
} from '@/lib/notes/upload-recovery'

const noteId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function neverCompletes() {
  return new Promise<never>(() => undefined)
}

describe('note upload completion recovery', () => {
  it('returns a direct completion without starting status recovery', async () => {
    const readStatus = vi.fn()
    const onRecovering = vi.fn()

    const result = await settleNoteUploadCompletion({
      complete: async () => ({ ok: true, publicationStatus: 'published' }),
      expectedPublicationStatus: 'published',
      noteId,
      onRecovering,
      readStatus,
      recoveryDelayMs: 25,
    })

    expect(result).toEqual({ ok: true, publicationStatus: 'published' })
    expect(onRecovering).not.toHaveBeenCalled()
    expect(readStatus).not.toHaveBeenCalled()
  })

  it('recovers a published note when the completion response hangs', async () => {
    const readStatus = vi.fn().mockResolvedValue({
      processingStatus: 'ready',
      publicationStatus: 'published',
    })

    const result = await settleNoteUploadCompletion({
      complete: neverCompletes,
      expectedPublicationStatus: 'published',
      noteId,
      pollAttempts: 1,
      readStatus,
      recoveryDelayMs: 0,
    })

    expect(result).toEqual({ ok: true, publicationStatus: 'published' })
    expect(readStatus).toHaveBeenCalledWith(noteId)
  })

  it('recovers a ready note when the server-action transport rejects', async () => {
    const result = await settleNoteUploadCompletion({
      complete: async () => {
        throw new Error('The server action connection closed.')
      },
      expectedPublicationStatus: 'published',
      noteId,
      pollAttempts: 1,
      readStatus: async () => ({
        processingStatus: 'ready',
        publicationStatus: 'published',
      }),
      recoveryDelayMs: 0,
    })

    expect(result).toEqual({ ok: true, publicationStatus: 'published' })
  })

  it('does not accept completion for a different publication intent', async () => {
    await expect(
      settleNoteUploadCompletion({
        complete: async () => ({ ok: true, publicationStatus: 'draft' }),
        expectedPublicationStatus: 'published',
        noteId,
        pollAttempts: 1,
        readStatus: async () => ({
          processingStatus: 'ready',
          publicationStatus: 'draft',
        }),
        recoveryDelayMs: 0,
      }),
    ).rejects.toBeInstanceOf(NoteUploadCompletionPendingError)
  })

  it('recovers a saved draft without treating it as published', async () => {
    const result = await settleNoteUploadCompletion({
      complete: neverCompletes,
      expectedPublicationStatus: 'draft',
      noteId,
      pollAttempts: 1,
      readStatus: async () => ({
        processingStatus: 'ready',
        publicationStatus: 'draft',
      }),
      recoveryDelayMs: 0,
    })

    expect(result).toEqual({ ok: true, publicationStatus: 'draft' })
  })

  it('reports a rejected upload as a verification failure', async () => {
    const result = await settleNoteUploadCompletion({
      complete: neverCompletes,
      expectedPublicationStatus: 'published',
      noteId,
      pollAttempts: 1,
      readStatus: async () => ({
        processingStatus: 'rejected',
        publicationStatus: 'draft',
      }),
      recoveryDelayMs: 0,
    })

    expect(result).toEqual({
      error: 'The uploaded file could not be verified.',
      ok: false,
    })
  })

  it('preserves the upload when completion remains uncertain', async () => {
    await expect(
      settleNoteUploadCompletion({
        complete: neverCompletes,
        expectedPublicationStatus: 'published',
        noteId,
        pollAttempts: 2,
        pollIntervalMs: 0,
        readStatus: async () => null,
        recoveryDelayMs: 0,
      }),
    ).rejects.toBeInstanceOf(NoteUploadCompletionPendingError)
  })

  it('treats status read failures as transient while polling', async () => {
    const readStatus = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce({
        processingStatus: 'ready',
        publicationStatus: 'published',
      })

    const result = await settleNoteUploadCompletion({
      complete: neverCompletes,
      expectedPublicationStatus: 'published',
      noteId,
      pollAttempts: 2,
      pollIntervalMs: 0,
      readStatus,
      recoveryDelayMs: 0,
    })

    expect(result).toEqual({ ok: true, publicationStatus: 'published' })
    expect(readStatus).toHaveBeenCalledTimes(2)
  })
})
