'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  completeNoteUploadAction,
  discardNoteUploadAction,
  prepareNoteUploadAction,
} from '@/app/dashboard/notes/new/actions'
import type {
  PreparedNoteUpload,
  NoteFileMimeType,
} from '@/lib/notes/storage/contracts'
import { createNoteFileUploadStorage } from '@/lib/notes/storage/supabase-browser'
import {
  createNoteUploadStatusReader,
  NoteUploadCompletionPendingError,
  settleNoteUploadCompletion,
} from '@/lib/notes/upload-recovery'
import { fingerprintFile } from './file-prep'

export type UploadStage =
  | 'idle'
  | 'checking'
  | 'preparing'
  | 'uploading'
  | 'verifying'
  | 'recovering'

export type PendingCompletion = {
  prepared: PreparedNoteUpload
  publish: boolean
}

export const stageLabels: Record<Exclude<UploadStage, 'idle'>, string> = {
  checking: 'Checking your file…',
  preparing: 'Preparing a private upload…',
  uploading: 'Uploading to your vault…',
  verifying: 'Verifying and saving…',
  recovering: 'Confirming your saved note…',
}

/** Owns the draft → upload → verify/recover pipeline for one note submission. */
export function useNoteUpload() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pendingCompletion, setPendingCompletion] =
    useState<PendingCompletion | null>(null)
  const [stage, setStage] = useState<UploadStage>('idle')

  const isPending = stage !== 'idle'
  const isLocked = isPending || pendingCompletion !== null

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
    file: File | null,
  ) {
    event.preventDefault()

    if (!file && !pendingCompletion) {
      setError('Choose the note file you want to add.')
      return
    }

    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null
    const publish = pendingCompletion
      ? pendingCompletion.publish
      : submitter?.value === 'publish'
    // React only guarantees currentTarget during the synchronous event handler.
    const form = event.currentTarget
    let preparedUpload = pendingCompletion?.prepared || null
    setError(null)

    try {
      if (!preparedUpload) {
        const selectedFile = file

        if (!selectedFile) {
          throw new Error('Choose the note file you want to add.')
        }

        const formData = new FormData(form)
        setStage('checking')
        const fingerprint = await fingerprintFile(selectedFile)
        formData.set('byteSize', String(selectedFile.size))
        formData.set(
          'mimeType',
          fingerprint.mimeType satisfies NoteFileMimeType,
        )
        formData.set('originalFilename', selectedFile.name)
        formData.set('sha256', fingerprint.sha256)

        setStage('preparing')
        const preparedResult = await prepareNoteUploadAction(formData)

        if (!preparedResult.ok) {
          throw new Error(preparedResult.error)
        }

        preparedUpload = preparedResult.prepared
        setStage('uploading')
        const storage = createNoteFileUploadStorage()
        await storage.upload(selectedFile, preparedUpload)
        setPendingCompletion({ prepared: preparedUpload, publish })
      }

      if (!preparedUpload) {
        throw new Error('The upload details were lost. Please try again.')
      }

      const uploadToComplete = preparedUpload

      setStage('verifying')
      const completedResult = await settleNoteUploadCompletion({
        complete: () =>
          completeNoteUploadAction({
            noteId: uploadToComplete.noteId,
            objectKey: uploadToComplete.objectKey,
            publish,
          }),
        expectedPublicationStatus: publish ? 'published' : 'draft',
        noteId: uploadToComplete.noteId,
        onRecovering: () => setStage('recovering'),
        readStatus: createNoteUploadStatusReader(),
      })

      if (!completedResult.ok) {
        throw new Error(completedResult.error)
      }

      const status = publish
        ? 'Your note is published.'
        : 'Your note is saved as a private draft.'
      setPendingCompletion(null)
      router.push(`/dashboard?status=${encodeURIComponent(status)}`)
      router.refresh()
    } catch (caughtError) {
      const preserveUpload =
        caughtError instanceof NoteUploadCompletionPendingError

      if (preparedUpload && !preserveUpload) {
        await discardNoteUploadAction({
          noteId: preparedUpload.noteId,
          objectKey: preparedUpload.objectKey,
        })
        setPendingCompletion(null)
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The note could not be saved. Please try again.',
      )
      setStage('idle')
    }
  }

  return {
    error,
    handleSubmit,
    isLocked,
    isPending,
    pendingCompletion,
    setError,
    stage,
  }
}
