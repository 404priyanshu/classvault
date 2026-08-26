'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import {
  completeNoteUploadAction,
  discardNoteUploadAction,
  prepareNoteUploadAction,
} from '@/app/dashboard/notes/new/actions'
import type { NoteFileMimeType } from '@/lib/notes/storage/contracts'
import { createNoteFileUploadStorage } from '@/lib/notes/storage/supabase-browser'
import {
  createNoteUploadStatusReader,
  settleNoteUploadCompletion,
} from '@/lib/notes/upload-recovery'
import { fingerprintFile, validateSelectedFile } from './file-prep'
import { titleFromFilename } from './filename-title'

export type BatchRowStatus = 'queued' | 'working' | 'done' | 'failed'

export type BatchRow = {
  error: string | null
  file: File
  /** Stable across re-orders and removals; File objects are not unique keys. */
  id: string
  status: BatchRowStatus
  title: string
}

export type SharedMetadata = {
  description: string
  noteType: string
  subjectName: string
  tags: string
  visibility: string
}

let rowCounter = 0

export function createBatchRows(files: File[]): {
  rejected: { name: string; reason: string }[]
  rows: BatchRow[]
} {
  const rows: BatchRow[] = []
  const rejected: { name: string; reason: string }[] = []

  for (const file of files) {
    const reason = validateSelectedFile(file)

    if (reason) {
      rejected.push({ name: file.name, reason })
      continue
    }

    rowCounter += 1
    rows.push({
      error: null,
      file,
      id: `row-${rowCounter}`,
      status: 'queued',
      title: titleFromFilename(file.name),
    })
  }

  return { rejected, rows }
}

/**
 * Uploads a queue of notes through the same draft → upload → verify pipeline
 * the single-note form uses, one file at a time.
 *
 * Sequential on purpose. Each note takes a draft row and a Storage object
 * before it is verified, so running the queue in parallel would multiply the
 * work left behind when something fails halfway. One at a time also keeps the
 * per-row status honest, which is the point of the screen.
 */
export function useBatchUpload() {
  const router = useRouter()
  const [rows, setRows] = useState<BatchRow[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const patchRow = useCallback((id: string, patch: Partial<BatchRow>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    )
  }, [])

  const addFiles = useCallback((files: File[]) => {
    const { rejected, rows: added } = createBatchRows(files)

    if (added.length) {
      setRows((current) => [...current, ...added])
    }

    setFormError(
      rejected.length
        ? `Skipped ${rejected.length} file${rejected.length === 1 ? '' : 's'}: ${rejected
            .map((entry) => `${entry.name} — ${entry.reason}`)
            .join('; ')}`
        : null,
    )
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows((current) => current.filter((row) => row.id !== id))
  }, [])

  const setRowTitle = useCallback(
    (id: string, title: string) => patchRow(id, { title }),
    [patchRow],
  )

  async function uploadOne(
    row: BatchRow,
    shared: SharedMetadata,
    publish: boolean,
  ) {
    const formData = new FormData()
    formData.set('description', shared.description)
    formData.set('noteType', shared.noteType)
    formData.set('subjectName', shared.subjectName)
    formData.set('tags', shared.tags)
    formData.set('title', row.title.trim())
    formData.set('visibility', shared.visibility)

    const fingerprint = await fingerprintFile(row.file)
    formData.set('byteSize', String(row.file.size))
    formData.set('mimeType', fingerprint.mimeType satisfies NoteFileMimeType)
    formData.set('originalFilename', row.file.name)
    formData.set('sha256', fingerprint.sha256)

    const prepared = await prepareNoteUploadAction(formData)

    if (!prepared.ok) {
      throw new Error(prepared.error)
    }

    try {
      await createNoteFileUploadStorage().upload(row.file, prepared.prepared)

      const completed = await settleNoteUploadCompletion({
        complete: () =>
          completeNoteUploadAction({
            noteId: prepared.prepared.noteId,
            objectKey: prepared.prepared.objectKey,
            publish,
          }),
        expectedPublicationStatus: publish ? 'published' : 'draft',
        noteId: prepared.prepared.noteId,
        onRecovering: () => {},
        readStatus: createNoteUploadStatusReader(),
      })

      if (!completed.ok) {
        throw new Error(completed.error)
      }
    } catch (error) {
      // Leave no half-made note behind; the draft and its object go together.
      await discardNoteUploadAction({
        noteId: prepared.prepared.noteId,
        objectKey: prepared.prepared.objectKey,
      })
      throw error
    }
  }

  async function run(shared: SharedMetadata, publish: boolean) {
    if (isRunning) return

    const untitled = rows.find((row) => row.title.trim().length < 3)

    if (untitled) {
      setFormError('Give every note a title of at least 3 characters.')
      return
    }

    if (!shared.subjectName.trim()) {
      setFormError('Choose a subject for this batch.')
      return
    }

    setFormError(null)
    setIsRunning(true)

    // Snapshot: rows may be re-rendered under us, and a failed run should stay
    // resumable by pressing upload again rather than starting over.
    const queue = rows.filter((row) => row.status !== 'done')
    let failures = 0

    for (const row of queue) {
      patchRow(row.id, { error: null, status: 'working' })

      try {
        await uploadOne(row, shared, publish)
        patchRow(row.id, { status: 'done' })
      } catch (error) {
        failures += 1
        patchRow(row.id, {
          error:
            error instanceof Error
              ? error.message
              : 'This note could not be saved.',
          status: 'failed',
        })
      }
    }

    setIsRunning(false)

    if (failures === 0) {
      const saved = queue.length
      const status = publish
        ? `Published ${saved} note${saved === 1 ? '' : 's'}.`
        : `Saved ${saved} draft${saved === 1 ? '' : 's'}.`
      router.push(`/dashboard?status=${encodeURIComponent(status)}`)
      router.refresh()
      return
    }

    setFormError(
      `${failures} of ${queue.length} could not be saved. Fix them below and upload again — the ones that worked are not repeated.`,
    )
  }

  return {
    addFiles,
    formError,
    isRunning,
    removeRow,
    rows,
    run,
    setFormError,
    setRowTitle,
  }
}
