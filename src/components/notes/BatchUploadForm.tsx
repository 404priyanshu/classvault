'use client'

import { CheckCircle2, FileText, Loader2, Trash2, TriangleAlert, Upload } from 'lucide-react'
import Link from 'next/link'
import { useId, useRef, useState } from 'react'
import { NOTE_FILE_ACCEPT } from './upload/FileDropzone'
import type { SubjectOption } from './subject-option'
import {
  useBatchUpload,
  type BatchRow,
  type SharedMetadata,
} from './upload/use-batch-upload'

type BatchUploadFormProps = {
  hasVerifiedUniversity: boolean
  subjects: SubjectOption[]
  universityName: string | null
}

const inputClass =
  'min-h-11 w-full rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]'

function StatusCell({ row }: { row: BatchRow }) {
  if (row.status === 'working') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-[#8a5a00]">
        <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> Uploading
      </span>
    )
  }

  if (row.status === 'done') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-[#17453a]">
        <CheckCircle2 aria-hidden className="h-3.5 w-3.5" /> Saved
      </span>
    )
  }

  if (row.status === 'failed') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-red-700">
        <TriangleAlert aria-hidden className="h-3.5 w-3.5" /> Failed
      </span>
    )
  }

  return <span className="text-xs font-medium text-[#171512]/50">Queued</span>
}

export function BatchUploadForm({
  hasVerifiedUniversity,
  subjects,
  universityName,
}: BatchUploadFormProps) {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [shared, setShared] = useState<SharedMetadata>({
    description: '',
    noteType: 'lecture_notes',
    subjectName: '',
    tags: '',
    visibility: 'public',
  })

  const {
    addFiles,
    formError,
    isRunning,
    removeRow,
    rows,
    run,
    setRowTitle,
  } = useBatchUpload()

  const doneCount = rows.filter((row) => row.status === 'done').length
  const remaining = rows.length - doneCount

  function patchShared(patch: Partial<SharedMetadata>) {
    setShared((current) => ({ ...current, ...patch }))
  }

  return (
    <>
      <section className="mt-10">
        <h1 className="font-display text-4xl font-black leading-[0.98] sm:text-6xl">
          Add a stack at once
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[#171512]/65 sm:text-lg">
          Pick several files from one subject, set the details once, and fix the
          titles inline. Each note still goes through the same checks as a
          single upload.{' '}
          <Link
            className="font-bold text-[#17453a] underline decoration-[#f0a202] decoration-2 underline-offset-4"
            href="/dashboard/notes/new"
          >
            Add one note instead
          </Link>
          .
        </p>
      </section>

      <div className="paper-card mt-8 rounded-2xl p-6 sm:p-8">
        {/* files */}
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragActive
              ? 'border-[#17453a] bg-[#17453a]/[0.06]'
              : 'border-[#171512]/35 bg-[#f6f1e5]'
          }`}
          htmlFor={fileInputId}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            setDragActive(false)
            if (isRunning) return
            addFiles([...event.dataTransfer.files])
          }}
        >
          {rows.length === 0 ? (
            <>
              <Upload aria-hidden className="h-8 w-8 text-[#17453a]" strokeWidth={1.6} />
              <span className="font-display mt-3 text-xl font-black">
                Drop your files here
              </span>
              <span className="mt-1 text-sm text-[#171512]/60">
                PDF, JPG, PNG or WebP · up to 25 MiB each · pick as many as you like
              </span>
            </>
          ) : (
            <>
              <CheckCircle2
                aria-hidden
                className="h-8 w-8 text-[#17453a]"
                strokeWidth={1.7}
              />
              <span className="font-display mt-3 text-xl font-black">
                {rows.length} file{rows.length === 1 ? '' : 's'} ready
              </span>
              <span className="mt-2 flex max-w-xl flex-wrap justify-center gap-1.5">
                {rows.slice(0, 6).map((row) => (
                  <span
                    className="rounded-full border border-[#171512]/25 bg-[#fffdf6] px-2.5 py-0.5 text-xs font-bold"
                    key={row.id}
                  >
                    {row.title || row.file.name}
                  </span>
                ))}
                {rows.length > 6 ? (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-[#171512]/55">
                    +{rows.length - 6} more
                  </span>
                ) : null}
              </span>
              <span className="mt-3 text-sm font-bold text-[#17453a] underline decoration-[#f0a202] decoration-2 underline-offset-4">
                Add more files
              </span>
            </>
          )}

          <input
            accept={NOTE_FILE_ACCEPT}
            className="sr-only"
            disabled={isRunning}
            id={fileInputId}
            multiple
            onChange={(event) => {
              addFiles([...(event.target.files || [])])
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            ref={fileInputRef}
            type="file"
          />
        </label>

        {/*
          The count is announced as well as shown: the editable rows sit below
          the shared fields, so without this the only confirmation that a drop
          worked is off-screen.
        */}
        <p aria-live="polite" className="sr-only">
          {rows.length
            ? `${rows.length} file${rows.length === 1 ? '' : 's'} ready to upload`
            : 'No files chosen yet'}
        </p>

        {/* shared details */}
        <fieldset className="mt-8 grid gap-5 sm:grid-cols-2" disabled={isRunning}>
          <legend className="font-display mb-1 text-lg font-black">
            Applies to every file in this stack
          </legend>

          <label className="grid gap-2 text-sm font-black">
            Subject
            <input
              autoComplete="off"
              className={inputClass}
              list="batch-subject-options"
              maxLength={120}
              onChange={(event) => patchShared({ subjectName: event.target.value })}
              placeholder="Start typing, e.g. Blockchain Engineering"
              value={shared.subjectName}
            />
            <datalist id="batch-subject-options">
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name} />
              ))}
            </datalist>
          </label>

          <label className="grid gap-2 text-sm font-black">
            Note type
            <select
              className={inputClass}
              onChange={(event) => patchShared({ noteType: event.target.value })}
              value={shared.noteType}
            >
              <option value="lecture_notes">Lecture notes</option>
              <option value="summary">Summary</option>
              <option value="pyq">Previous-year paper</option>
              <option value="solution">Solution</option>
              <option value="lab">Lab</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-black">
            Who can open these
            <select
              className={inputClass}
              onChange={(event) => patchShared({ visibility: event.target.value })}
              value={shared.visibility}
            >
              <option value="public">Anyone on ClassVault</option>
              <option disabled={!hasVerifiedUniversity} value="university">
                {universityName || 'My university'} only
                {hasVerifiedUniversity ? '' : ' — needs a verified campus email'}
              </option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-black">
            Tags
            <input
              className={inputClass}
              onChange={(event) => patchShared({ tags: event.target.value })}
              placeholder="midsem, unit 3"
              value={shared.tags}
            />
          </label>

          <label className="grid gap-2 text-sm font-black sm:col-span-2">
            Description
            <textarea
              className="min-h-[88px] w-full rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] p-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]"
              maxLength={2000}
              onChange={(event) => patchShared({ description: event.target.value })}
              placeholder="What these cover, and which exam they are for."
              value={shared.description}
            />
          </label>
        </fieldset>

        {/* per-file titles */}
        {rows.length > 0 ? (
          <div className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-4">
              <h2 className="font-display text-lg font-black">
                {rows.length} file{rows.length === 1 ? '' : 's'}
              </h2>
              {doneCount > 0 ? (
                <p aria-live="polite" className="text-xs font-bold text-[#17453a]">
                  {doneCount} saved · {remaining} to go
                </p>
              ) : null}
            </div>

            <ul className="grid gap-2">
              {rows.map((row) => (
                <li
                  className="grid gap-2 rounded-lg border border-[#171512]/20 bg-[#f6f1e5] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  key={row.id}
                >
                  <div className="grid gap-1">
                    <input
                      aria-label={`Title for ${row.file.name}`}
                      className="min-h-10 w-full rounded-sm border border-[#171512]/30 bg-[#fffdf6] px-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#f0a202]"
                      disabled={isRunning || row.status === 'done'}
                      maxLength={180}
                      onChange={(event) => setRowTitle(row.id, event.target.value)}
                      placeholder="Title this note"
                      value={row.title}
                    />
                    <span className="flex items-center gap-1.5 text-[11px] text-[#171512]/50">
                      <FileText aria-hidden className="h-3 w-3" />
                      {row.file.name}
                    </span>
                    {row.error ? (
                      <span className="text-[11px] font-bold text-red-700">
                        {row.error}
                      </span>
                    ) : null}
                  </div>

                  <StatusCell row={row} />

                  <button
                    aria-label={`Remove ${row.file.name}`}
                    className="justify-self-start rounded-md border border-[#171512]/25 p-2 transition-colors hover:bg-[#171512]/[0.06] disabled:opacity-40 sm:justify-self-auto"
                    disabled={isRunning}
                    onClick={() => removeRow(row.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {formError ? (
          <p
            aria-live="polite"
            className="mt-6 rounded-lg border-[1.5px] border-red-700/40 bg-red-50/80 p-3 text-sm font-bold text-red-800"
          >
            {formError}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="btn-saffron min-h-12 rounded-full px-7 font-black disabled:cursor-wait disabled:opacity-70"
            disabled={isRunning || rows.length === 0}
            onClick={() => void run(shared, true)}
            type="button"
          >
            {isRunning
              ? 'Uploading…'
              : `Publish ${remaining || rows.length} note${(remaining || rows.length) === 1 ? '' : 's'}`}
          </button>
          <button
            className="min-h-12 rounded-full border-[1.5px] border-[#171512] px-7 font-black transition-colors hover:bg-[#171512]/[0.06] disabled:opacity-50"
            disabled={isRunning || rows.length === 0}
            onClick={() => void run(shared, false)}
            type="button"
          >
            Save as drafts
          </button>
          <p className="text-xs font-medium text-[#171512]/55">
            Uploaded one at a time so a failure never takes the rest with it.
          </p>
        </div>
      </div>
    </>
  )
}
