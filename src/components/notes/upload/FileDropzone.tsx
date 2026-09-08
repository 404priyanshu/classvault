'use client'

import { FileCheck2, LockKeyhole, Upload, X } from 'lucide-react'
import type { DragEvent } from 'react'
import { formatFileSize } from '@/lib/notes/library'
import { cn } from '@/lib/utils'

export const NOTE_FILE_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp'

export function FileDropzone({
  dragActive,
  file,
  fileInputId,
  fileInputRef,
  isLocked,
  onChooseFile,
  onClearFile,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: {
  dragActive: boolean
  file: File | null
  fileInputId: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  isLocked: boolean
  onChooseFile: (file: File | null) => void
  onClearFile: () => void
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
}) {
  return (
    <div className="border-b-[1.5px] border-club-ink p-5 sm:p-8 lg:border-b-0 lg:border-r-[1.5px]">
      <div
        className={cn(
          'flex min-h-[390px] flex-col items-center justify-center rounded-sm border-2 border-dashed border-club-purple px-5 py-9 text-center transition-colors focus-within:ring-4 focus-within:ring-club-purple/25',
          dragActive && 'bg-club-yellow/10',
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {file ? (
          <>
            <span className="grid h-24 w-24 place-items-center rounded-full border border-club-ink/25 bg-club-purple ">
              <FileCheck2 className="h-10 w-10 text-club-paper" />
            </span>
            <p className="font-display mt-7 max-w-sm break-words text-2xl font-black">
              {file.name}
            </p>
            <p className="mt-2 text-sm font-bold text-club-muted">
              {formatFileSize(file.size)} · private until you publish
            </p>
            <button
              className="app-button mt-6 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black disabled:opacity-50"
              disabled={isLocked}
              onClick={onClearFile}
              type="button"
            >
              <X className="h-4 w-4" />
              Choose another file
            </button>
          </>
        ) : (
          <>
            <span aria-hidden className="grid h-32 w-28 -rotate-6 place-items-center rounded-3xl bg-club-yellow text-club-purple shadow-[10px_10px_0_#e7e4fa]">
              <Upload size={48} strokeWidth={1.5} />
            </span>
            <h2 className="font-display mt-5 text-3xl font-black">
              Drop your note here
            </h2>
            <p className="mt-2 text-sm font-bold text-club-muted sm:text-base">
              PDF, JPG, PNG or WebP · up to 25 MiB
            </p>
            <span className="my-5 text-sm text-club-muted">or</span>
            <label
              className="app-button inline-flex cursor-pointer items-center gap-2 rounded-md px-5 py-3 text-sm font-black"
              htmlFor={fileInputId}
            >
              <Upload className="h-4 w-4" />
              Choose file
            </label>
          </>
        )}
        <input
          accept={NOTE_FILE_ACCEPT}
          className="sr-only"
          disabled={isLocked}
          id={fileInputId}
          onChange={(event) => onChooseFile(event.target.files?.item(0) || null)}
          ref={fileInputRef}
          type="file"
        />
      </div>

      <p className="mt-5 flex items-center gap-2 text-sm font-bold text-club-purple">
        <LockKeyhole className="h-4 w-4" />
        Your file stays private until you publish.
      </p>
    </div>
  )
}
