'use client'

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
              <span className="h-px w-10 bg-[#171512]/35 sm:w-20" />
            ) : null}
            <span className="flex items-center gap-2">
              <span
                className={
                  'grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-[#171512] bg-[#fffdf6]' +
                  (index === 0 ? ' bg-[#17453a] text-[#fffdf6]' : '')
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
        <h1 className="font-display text-5xl font-black leading-[0.95] sm:text-7xl">
          Add to your vault
        </h1>
        <p className="mt-4 text-base text-[#171512]/65 sm:text-lg">
          Share your notes. Help your batch. Leave a legacy.
        </p>
      </section>

      <form
        aria-busy={isPending}
        className="paper-card relative mt-8 overflow-hidden bg-[#fffdf6]"
        onSubmit={(event) => void handleSubmit(event, file)}
      >
        <div className="absolute right-5 top-4 hidden rotate-3 border-2 border-dashed border-[#17453a]/45 px-4 py-2 font-hand text-xl font-bold text-[#17453a]/65 lg:block">
          share knowledge
        </div>

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
