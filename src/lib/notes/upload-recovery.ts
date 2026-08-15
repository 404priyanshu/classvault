import { createClient } from '@/lib/supabase/client'

export type NoteUploadCompletionResult =
  | { ok: true; publicationStatus: string }
  | { error: string; ok: false }

export type NoteUploadStatus = {
  processingStatus: string
  publicationStatus: string
}

type SettleNoteUploadCompletionInput = {
  complete: () => Promise<NoteUploadCompletionResult>
  expectedPublicationStatus: 'draft' | 'published'
  noteId: string
  onRecovering?: () => void
  pollAttempts?: number
  pollIntervalMs?: number
  recoveryDelayMs?: number
  readStatus: (noteId: string) => Promise<NoteUploadStatus | null>
}

type CompletionOutcome =
  | { kind: 'completed'; result: NoteUploadCompletionResult }
  | { error: unknown; kind: 'error' }
  | { kind: 'recovered'; result: NoteUploadCompletionResult }

export class NoteUploadCompletionPendingError extends Error {
  constructor() {
    super(
      'Your file is uploaded, but confirmation is taking longer than expected. Retry verification—do not upload it again.',
    )
    this.name = 'NoteUploadCompletionPendingError'
  }
}

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }

    const finish = () => {
      clearTimeout(timeout)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const timeout = setTimeout(finish, milliseconds)
    signal.addEventListener('abort', finish, { once: true })

    if (signal.aborted) finish()
  })
}

function waitForRecovery(): Promise<CompletionOutcome> {
  return new Promise(() => undefined)
}

async function recoverCompletion(
  input: SettleNoteUploadCompletionInput,
  signal: AbortSignal,
): Promise<CompletionOutcome> {
  await wait(input.recoveryDelayMs ?? 1500, signal)

  if (signal.aborted) {
    return {
      error: new NoteUploadCompletionPendingError(),
      kind: 'error',
    }
  }

  input.onRecovering?.()

  const attempts = input.pollAttempts ?? 24
  const interval = input.pollIntervalMs ?? 750

  for (let attempt = 0; attempt < attempts && !signal.aborted; attempt += 1) {
    try {
      const status = await input.readStatus(input.noteId)

      if (
        status?.processingStatus === 'ready' &&
        status.publicationStatus === input.expectedPublicationStatus
      ) {
        return {
          kind: 'recovered',
          result: {
            ok: true,
            publicationStatus: status.publicationStatus,
          },
        }
      }

      if (status?.processingStatus === 'rejected') {
        return {
          kind: 'completed',
          result: {
            error: 'The uploaded file could not be verified.',
            ok: false,
          },
        }
      }
    } catch {
      // A transient status read must not turn a completed upload into a failure.
    }

    if (attempt < attempts - 1) {
      await wait(interval, signal)
    }
  }

  return {
    error: new NoteUploadCompletionPendingError(),
    kind: 'error',
  }
}

export async function settleNoteUploadCompletion(
  input: SettleNoteUploadCompletionInput,
): Promise<NoteUploadCompletionResult> {
  const recoveryController = new AbortController()
  const completion: Promise<CompletionOutcome> = input.complete().then(
    (result): CompletionOutcome | Promise<CompletionOutcome> =>
      result.ok &&
      result.publicationStatus !== input.expectedPublicationStatus
        ? waitForRecovery()
        : { kind: 'completed', result },
    waitForRecovery,
  )

  try {
    const outcome = await Promise.race([
      completion,
      recoverCompletion(input, recoveryController.signal),
    ])

    if (outcome.kind === 'error') {
      throw outcome.error
    }

    return outcome.result
  } finally {
    recoveryController.abort()
  }
}

export function createNoteUploadStatusReader() {
  const supabase = createClient()

  return async (noteId: string): Promise<NoteUploadStatus | null> => {
    const { data, error } = await supabase.rpc('get_note_upload_status', {
      p_note_id: noteId,
    })

    if (error) {
      throw new Error('The note status could not be checked.')
    }

    const status = data?.[0]

    return status
      ? {
          processingStatus: status.processing_status,
          publicationStatus: status.publication_status,
        }
      : null
  }
}
