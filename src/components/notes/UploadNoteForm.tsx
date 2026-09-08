'use client'

import Link from 'next/link'
import { useId, useRef, useState } from 'react'
import { FileDropzone } from './upload/FileDropzone'
import { NoteMetadataFields } from './upload/NoteMetadataFields'
import { UploadFormFooter } from './upload/UploadFormFooter'
import { useNoteUpload } from './upload/use-note-upload'
import type { SubjectOption } from './subject-option'
import { validateSelectedFile } from './upload/file-prep'

type UploadNoteFormProps = {
  hasVerifiedUniversity: boolean
  subjects: SubjectOption[]
  universityName: string | null
}

export function UploadNoteForm({
  hasVerifiedUniversity,
  subjects,
  universityName,
}: UploadNoteFormProps) {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [tags, setTags] = useState('')
  const {
    error,
    handleSubmit,
    isLocked,
    isPending,
    pendingCompletion,
    setError,
    stage,
  } = useNoteUpload()

  const tagCount = [
    ...new Set(
      tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].length

  function chooseFile(nextFile: File | null) {
    if (isLocked) return

    if (!nextFile) {
      setFile(null)
      return
    }

    const fileError = validateSelectedFile(nextFile)

    if (fileError) {
      setError(fileError)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setError(null)
    setFile(nextFile)
  }

  return (
    <>
      <div className="mx-auto flex max-w-xl items-center justify-center gap-3 text-sm font-black sm:gap-5">
        {['File', 'Details', 'Publish'].map((label, index) => (
          <div className="contents" key={label}>
            {index > 0 ? (
              <span className="h-px w-10 bg-club-ink/35 sm:w-20" />
            ) : null}
            <span className="flex items-center gap-2">
              <span
                className={
                  'grid h-9 w-9 place-items-center rounded-xl border border-club-line bg-club-paper' +
                  (index === 0 ? ' bg-club-purple text-club-paper' : '')
                }
              >
                {index + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </span>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h1 className="app-title">Add to your vault</h1>
        <p className="mt-3 text-sm leading-relaxed text-club-muted">
          Share your notes. Help your batch. Leave a legacy.{' '}
          <Link
            className="font-bold text-club-purple underline decoration-club-yellow decoration-2 underline-offset-4"
            href="/dashboard/notes/batch"
          >
            Got a whole folder? Add them together
          </Link>
          .
        </p>
      </section>

      <form
        aria-busy={isPending}
        className="app-panel relative mt-6 overflow-hidden"
        onSubmit={(event) => void handleSubmit(event, file)}
      >
        <fieldset className="contents" disabled={isLocked}>
          <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
            <FileDropzone
              dragActive={dragActive}
              file={file}
              fileInputId={fileInputId}
              fileInputRef={fileInputRef}
              isLocked={isLocked}
              onChooseFile={chooseFile}
              onClearFile={() => {
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              onDragEnter={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                setDragActive(false)
                if (isLocked) return
                chooseFile(event.dataTransfer.files.item(0))
              }}
            />

            <NoteMetadataFields
              description={description}
              hasVerifiedUniversity={hasVerifiedUniversity}
              onDescriptionChange={setDescription}
              onTagsChange={setTags}
              subjects={subjects}
              tagCount={tagCount}
              tags={tags}
              universityName={universityName}
            />
          </div>
        </fieldset>

        <UploadFormFooter
          error={error}
          isPending={isPending}
          pendingCompletion={pendingCompletion}
          stage={stage}
          tagCount={tagCount}
        />
      </form>
    </>
  )
}
