'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  FileCheck2,
  FileText,
  Globe2,
  GraduationCap,
  Info,
  LockKeyhole,
  RotateCcw,
  Save,
  Send,
  Upload,
  X,
} from 'lucide-react'
import {
  useId,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react'
import spotNote from '@/assets/spot-note.webp'
import { Spinner } from '@/components/ui/spinner'
import {
  completeNoteUploadAction,
  discardNoteUploadAction,
  prepareNoteUploadAction,
} from '@/app/dashboard/notes/new/actions'
import {
  NOTE_FILE_MAX_BYTES,
  type PreparedNoteUpload,
  type NoteFileMimeType,
} from '@/lib/notes/storage/contracts'
import { detectNoteFileMimeType } from '@/lib/notes/storage/file-signature'
import { createNoteFileUploadStorage } from '@/lib/notes/storage/supabase-browser'
import {
  createNoteUploadStatusReader,
  NoteUploadCompletionPendingError,
  settleNoteUploadCompletion,
} from '@/lib/notes/upload-recovery'
import { cn } from '@/lib/utils'

type SubjectOption = {
  code: string | null
  id: number
  name: string
  university_id: number | null
}

type UploadNoteFormProps = {
  hasVerifiedUniversity: boolean
  subjects: SubjectOption[]
  universityName: string | null
}

type UploadStage =
  | 'idle'
  | 'checking'
  | 'preparing'
  | 'uploading'
  | 'verifying'
  | 'recovering'

type PendingCompletion = {
  prepared: PreparedNoteUpload
  publish: boolean
}

const stageLabels: Record<Exclude<UploadStage, 'idle'>, string> = {
  checking: 'Checking your file…',
  preparing: 'Preparing a private upload…',
  uploading: 'Uploading to your vault…',
  verifying: 'Verifying and saving…',
  recovering: 'Confirming your saved note…',
}

const accept = 'application/pdf,image/jpeg,image/png,image/webp'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function fingerprintFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mimeType = detectNoteFileMimeType(bytes)

  if (!mimeType) {
    throw new Error('Use a valid PDF, JPG, PNG, or WebP file.')
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const sha256 = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return { mimeType, sha256 }
}

function validateSelectedFile(file: File) {
  if (file.size < 1) {
    return 'Choose a file that is not empty.'
  }

  if (file.size > NOTE_FILE_MAX_BYTES) {
    return 'Your note must be 25 MiB or smaller.'
  }

  return null
}

export function UploadNoteForm({
  hasVerifiedUniversity,
  subjects,
  universityName,
}: UploadNoteFormProps) {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [pendingCompletion, setPendingCompletion] =
    useState<PendingCompletion | null>(null)
  const [stage, setStage] = useState<UploadStage>('idle')
  const [tags, setTags] = useState('')

  const isPending = stage !== 'idle'
  const isLocked = isPending || pendingCompletion !== null
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

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
    if (isLocked) return
    chooseFile(event.dataTransfer.files.item(0))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-[#171512] bg-[#fffdf6]',
                  index === 0 && 'bg-[#17453a] text-[#fffdf6]',
                )}
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
        onSubmit={handleSubmit}
      >
        <div className="absolute right-5 top-4 hidden rotate-3 border-2 border-dashed border-[#17453a]/45 px-4 py-2 font-hand text-xl font-bold text-[#17453a]/65 lg:block">
          share knowledge
        </div>

        <fieldset className="contents" disabled={isLocked}>
          <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
            <div className="border-b-[1.5px] border-[#171512] p-5 sm:p-8 lg:border-b-0 lg:border-r-[1.5px]">
            <div
              className={cn(
                'bg-ruled flex min-h-[390px] flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#17453a] px-5 py-9 text-center transition-colors',
                dragActive && 'bg-[#f0a202]/10',
              )}
              onDragEnter={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <span className="grid h-24 w-24 place-items-center rounded-full border-[1.5px] border-[#171512] bg-[#17453a] shadow-[4px_4px_0_#171512]">
                    <FileCheck2 className="h-10 w-10 text-[#fffdf6]" />
                  </span>
                  <p className="font-display mt-7 max-w-sm break-words text-2xl font-black">
                    {file.name}
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#171512]/55">
                    {formatBytes(file.size)} · private until you publish
                  </p>
                  <button
                    className="mt-6 inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#171512] bg-[#fffdf6] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#171512] disabled:opacity-50"
                    disabled={isLocked}
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                    Choose another file
                  </button>
                </>
              ) : (
                <>
                  <Image
                    alt="Illustrated stack of study notes"
                    className="h-32 w-32 object-contain sm:h-40 sm:w-40"
                    priority
                    src={spotNote}
                  />
                  <h2 className="font-display mt-5 text-3xl font-black">
                    Drop your note here
                  </h2>
                  <p className="mt-2 text-sm font-bold text-[#171512]/55 sm:text-base">
                    PDF, JPG, PNG or WebP · up to 25 MiB
                  </p>
                  <span className="my-5 text-sm text-[#171512]/50">or</span>
                  <label
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border-[1.5px] border-[#171512] bg-[#fffdf6] px-5 py-3 text-sm font-black shadow-[3px_3px_0_#171512] transition-transform hover:-translate-y-0.5"
                    htmlFor={fileInputId}
                  >
                    <Upload className="h-4 w-4" />
                    Choose file
                  </label>
                </>
              )}
              <input
                accept={accept}
                className="sr-only"
                disabled={isLocked}
                id={fileInputId}
                onChange={(event) => chooseFile(event.target.files?.item(0) || null)}
                ref={fileInputRef}
                type="file"
              />
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm font-bold text-[#17453a]">
              <LockKeyhole className="h-4 w-4" />
              Your file stays private until you publish.
            </p>
            </div>

            <div className="bg-ruled p-5 sm:p-8">
              <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-black">
                Title
                <input
                  className="min-h-11 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]"
                  maxLength={180}
                  name="title"
                  placeholder="Enter a clear and specific title"
                  required
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-black">
                  Subject
                  <select
                    className="min-h-11 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]"
                    defaultValue=""
                    name="subjectId"
                    required
                  >
                    <option disabled value="">
                      Select your subject
                    </option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code ? `${subject.code} · ` : ''}
                        {subject.name}
                        {subject.university_id ? ' · campus' : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-black">
                  Note type
                  <select
                    className="min-h-11 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]"
                    defaultValue=""
                    name="noteType"
                    required
                  >
                    <option disabled value="">
                      Select note type
                    </option>
                    <option value="lecture_notes">Lecture notes</option>
                    <option value="summary">Summary</option>
                    <option value="pyq">Previous-year paper</option>
                    <option value="solution">Solution</option>
                    <option value="lab">Lab material</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>

              <fieldset>
                <legend className="text-sm font-black">Who can access it?</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer gap-3 rounded-sm border-[1.5px] border-[#171512] bg-[#17453a]/5 p-4 has-[:checked]:border-[#17453a] has-[:checked]:shadow-[3px_3px_0_#17453a]">
                    <input
                      className="mt-1 accent-[#17453a]"
                      defaultChecked
                      name="visibility"
                      type="radio"
                      value="public"
                    />
                    <span>
                      <span className="flex items-center gap-2 font-black">
                        <Globe2 className="h-4 w-4" /> Public
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-[#171512]/60">
                        Any eligible ClassVault student can discover and access
                        this note.
                      </span>
                    </span>
                  </label>

                  <label
                    className={cn(
                      'flex gap-3 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] p-4 has-[:checked]:border-[#17453a] has-[:checked]:shadow-[3px_3px_0_#17453a]',
                      hasVerifiedUniversity
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <input
                      className="mt-1 accent-[#17453a]"
                      disabled={!hasVerifiedUniversity}
                      name="visibility"
                      type="radio"
                      value="university"
                    />
                    <span>
                      <span className="flex items-center gap-2 font-black">
                        <GraduationCap className="h-4 w-4" /> University only
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-[#171512]/60">
                        {hasVerifiedUniversity
                          ? `Only verified students at ${universityName || 'your university'} can access it.`
                          : 'Verify your university membership to use this scope.'}
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <p className="flex items-start gap-2 text-xs leading-relaxed text-[#171512]/60">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Misleading, unsafe, or plagiarized content may be restricted or
                removed after review.
              </p>

              <label className="grid gap-2 text-sm font-black">
                <span className="flex items-center justify-between gap-3">
                  Description <span>{description.length} / 2000</span>
                </span>
                <textarea
                  className="min-h-24 resize-y rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]"
                  maxLength={2000}
                  name="description"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Add a short description about this note (optional)"
                  value={description}
                />
              </label>

              <label className="grid gap-2 text-sm font-black">
                <span className="flex items-center justify-between gap-3">
                  Tags <span>{tagCount} / 10</span>
                </span>
                <input
                  aria-invalid={tagCount > 10}
                  className="min-h-11 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202] aria-[invalid=true]:border-red-700"
                  name="tags"
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="midsem, important, pyq"
                  value={tags}
                />
                <span className="text-xs font-medium text-[#171512]/55">
                  Separate up to 10 lowercase tags with commas.
                </span>
              </label>
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 border-t-[1.5px] border-[#171512] bg-[#fffaf0] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div aria-live="polite" className="min-h-6 text-sm font-bold">
            {error ? (
              <span className="flex items-start gap-2 text-red-800">
                <FileText className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </span>
            ) : isPending ? (
              <span className="flex items-center gap-2 text-[#17453a]">
                <Spinner decorative size={22} />
                {stageLabels[stage as Exclude<UploadStage, 'idle'>]}
              </span>
            ) : (
              <span className="text-[#171512]/50">
                Your metadata and file are checked before publication.
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pendingCompletion ? (
              <button
                className="btn-saffron inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-6 font-black disabled:cursor-wait disabled:opacity-60 sm:col-span-2"
                disabled={isPending}
                name="intent"
                type="submit"
                value="retry"
              >
                <RotateCcw className="h-4 w-4" /> Retry verification
              </button>
            ) : (
              <>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-6 font-black shadow-[3px_3px_0_#171512] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                  disabled={isPending || tagCount > 10}
                  name="intent"
                  type="submit"
                  value="draft"
                >
                  <Save className="h-4 w-4" /> Save draft
                </button>
                <button
                  className="btn-saffron inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-6 font-black disabled:cursor-wait disabled:opacity-60"
                  disabled={isPending || tagCount > 10}
                  name="intent"
                  type="submit"
                  value="publish"
                >
                  <Send className="h-4 w-4" /> Publish note
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </>
  )
}
