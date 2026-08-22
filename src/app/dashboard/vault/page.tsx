import Link from 'next/link'
import {
  ArrowRight,
  Clock3,
  FileArchive,
  FileText,
  FolderOpen,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { VaultLifecycleButton } from '@/components/notes/VaultLifecycleButton'
import { formatNoteType } from '@/lib/notes/library'
import {
  daysUntilPurge,
  formatVaultFileSize,
  formatVaultStatus,
  type OwnedNote,
} from '@/lib/notes/vault'
import { createClient } from '@/lib/supabase/server'
import { deleteNoteAction, restoreNoteAction } from './actions'

export const dynamic = 'force-dynamic'

type VaultPageProps = {
  searchParams: Promise<{ status?: string; view?: string }>
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function statusMessage(value: string | undefined) {
  if (!value) return null
  if (value === 'deleted') return 'Note moved to Trash. It can be restored for 30 days.'
  if (value === 'restored') return 'Note restored to your active uploads.'
  return value
}

function LifecycleBadge({ note }: { note: OwnedNote }) {
  const status = formatVaultStatus(note)
  const tone =
    status === 'Published'
      ? 'text-[#2d7c58]'
      : status === 'Upload needs attention'
        ? 'text-[#9a3f2f]'
        : 'text-[#b56d00]'

  return <span className={`text-xs font-black ${tone}`}>{status}</span>
}

function OwnedNoteRow({ note }: { note: OwnedNote }) {
  const canOpen = note.publication_status === 'published' && !note.deleted_at
  const subject = note.subject_code || note.subject_name || 'General notes'
  const recoveryDays = daysUntilPurge(note.purge_after)

  return (
    <article className="grid gap-4 border-b border-[#d9cfbc] px-4 py-5 last:border-b-0 sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:px-5 lg:px-6">
      <div className="bg-ruled relative grid h-20 place-items-center overflow-hidden border border-[#bfb39d] bg-[#f1eadb]">
        <span className="absolute left-0 top-0 h-full w-1.5 bg-[#f0a202]" />
        {note.deleted_at ? (
          <Trash2 aria-hidden className="h-7 w-7 text-[#9a3f2f]" strokeWidth={1.5} />
        ) : (
          <FileText aria-hidden className="h-7 w-7 text-[#17453a]" strokeWidth={1.5} />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#17453a]">
          <span>{subject}</span>
          <span aria-hidden className="text-[#171512]/25">/</span>
          <span className="text-[#171512]/55">{formatNoteType(note.note_type)}</span>
        </div>
        <h2 className="font-display mt-1 text-xl font-black leading-tight text-[#171512]">
          {canOpen ? (
            <Link className="transition-colors hover:text-[#17453a]" href={`/dashboard/notes/${note.note_id}`}>
              {note.title}
            </Link>
          ) : (
            note.title
          )}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#171512]/55">
          <LifecycleBadge note={note} />
          <span>{note.visibility === 'university' ? 'Campus' : 'Public'}</span>
          <span>{formatVaultFileSize(note.byte_size)}</span>
          {note.original_filename ? <span className="truncate">{note.original_filename}</span> : null}
          {note.deleted_at && recoveryDays !== null ? (
            <span className="font-bold text-[#9a3f2f]">{recoveryDays} days left</span>
          ) : null}
          {!note.deleted_at ? (
            <span>Updated {dateFormatter.format(new Date(note.updated_at))}</span>
          ) : null}
          {note.rating_count > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star aria-hidden className="h-3.5 w-3.5 fill-[#f0a202] text-[#b56d00]" />
              {note.average_rating?.toFixed(1)} ({note.rating_count})
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
        {canOpen ? (
          <Link className="inline-flex min-h-10 items-center gap-1.5 border border-[#bfb39d] bg-[#fffdf6] px-3 text-xs font-black text-[#17453a] hover:border-[#17453a]" href={`/dashboard/notes/${note.note_id}`}>
            Open note <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        ) : null}
        {note.deleted_at ? (
          <VaultLifecycleButton action={restoreNoteAction} noteId={note.note_id} restore />
        ) : (
          <VaultLifecycleButton action={deleteNoteAction} noteId={note.note_id} />
        )}
      </div>
    </article>
  )
}

export default async function VaultPage({ searchParams }: VaultPageProps) {
  const params = await searchParams
  const isTrash = params.view === 'trash'
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) redirect('/auth/sign-in?next=/dashboard/vault')

  const { data, error } = await supabase.rpc('list_owned_notes', {
    p_include_deleted: isTrash,
  })

  if (error) throw new Error('Your note vault could not be loaded.')

  const notes = (data || []) as OwnedNote[]
  const message = statusMessage(params.status)

  return (
    <div className="mx-auto max-w-[1320px] space-y-7 sm:space-y-8">
      <AuthMessage status={message || undefined} />

      <section className="flex flex-col gap-5 border-b border-[#cfc4ae] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-black leading-none sm:text-5xl">My Vault</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
            Keep track of what you&apos;ve shared, what&apos;s still uploading, and what&apos;s safe to recover.
          </p>
        </div>
        <Link className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 border border-[#171512] bg-[#17453a] px-4 text-sm font-black text-[#fffdf6] shadow-[3px_3px_0_#171512] transition-transform hover:-translate-y-0.5 sm:w-auto" href="/dashboard/notes/new">
          <Upload aria-hidden className="h-4 w-4" />
          Upload notes
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link className={!isTrash ? 'border border-[#17453a] bg-[#17453a] p-4 text-[#fffdf6] shadow-[3px_3px_0_#171512]' : 'border border-[#cfc4ae] bg-[#fffdf6] p-4 text-[#171512] hover:border-[#17453a]'} href="/dashboard/vault">
          <FolderOpen aria-hidden className="h-5 w-5" />
          <span className="mt-3 block text-sm font-black">Active uploads</span>
          <span className="mt-1 block text-xs opacity-70">Published, drafts, and upload status</span>
        </Link>
        <Link className={isTrash ? 'border border-[#9a3f2f] bg-[#9a3f2f] p-4 text-[#fffdf6] shadow-[3px_3px_0_#171512]' : 'border border-[#cfc4ae] bg-[#fffdf6] p-4 text-[#171512] hover:border-[#9a3f2f]'} href="/dashboard/vault?view=trash">
          <Trash2 aria-hidden className="h-5 w-5" />
          <span className="mt-3 block text-sm font-black">Trash</span>
          <span className="mt-1 block text-xs opacity-70">Recover notes for up to 30 days</span>
        </Link>
        <div className="border border-[#cfc4ae] bg-[#fffdf6] p-4">
          <ShieldCheck aria-hidden className="h-5 w-5 text-[#17453a]" />
          <span className="mt-3 block text-sm font-black">Owner controls</span>
          <span className="mt-1 block text-xs text-[#171512]/55">Your identity and files stay private here</span>
        </div>
      </section>

      <section aria-labelledby="vault-list-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-black" id="vault-list-heading">
              {isTrash ? 'Notes in Trash' : 'Your notes'}
            </h2>
            <p className="mt-1 text-xs text-[#171512]/55">
              {isTrash
                ? 'Deleted notes are hidden from every ordinary library and download.'
                : notes.length === 1
                  ? '1 note in your vault'
                  : `${notes.length} notes in your vault`}
            </p>
          </div>
          {isTrash ? <Clock3 aria-hidden className="h-5 w-5 text-[#9a3f2f]" /> : <FileArchive aria-hidden className="h-5 w-5 text-[#17453a]" />}
        </div>

        <div className="overflow-hidden border border-[#cfc4ae] bg-[#fffdf6] shadow-[3px_3px_0_rgba(23,21,18,0.08)]">
          {notes.length > 0 ? notes.map((note) => <OwnedNoteRow key={note.note_id} note={note} />) : (
            <div className="bg-ruled grid min-h-[300px] place-items-center px-6 py-12 text-center">
              <div className="max-w-md">
                {isTrash ? <Trash2 aria-hidden className="mx-auto h-10 w-10 text-[#9a3f2f]" strokeWidth={1.4} /> : <FileArchive aria-hidden className="mx-auto h-10 w-10 text-[#17453a]" strokeWidth={1.4} />}
                <h3 className="font-display mt-4 text-2xl font-black">{isTrash ? 'Trash is clear' : 'Your vault is waiting'}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#171512]/60">
                  {isTrash ? 'Deleted notes will stay recoverable here for 30 days.' : 'Upload your first useful note and keep it close to the students who need it.'}
                </p>
                {!isTrash ? <Link className="mt-5 inline-flex min-h-10 items-center gap-2 border border-[#171512] bg-[#17453a] px-4 text-sm font-black text-[#fffdf6] shadow-[3px_3px_0_#171512]" href="/dashboard/notes/new">Upload your first note <ArrowRight aria-hidden className="h-4 w-4" /></Link> : null}
              </div>
            </div>
          )}
        </div>
      </section>

      {isTrash && notes.length > 0 ? (
        <p className="text-xs leading-relaxed text-[#171512]/55">
          Notes are permanently removed after their recovery window. A note under a platform retention hold will remain until that hold is released.
        </p>
      ) : null}
    </div>
  )
}
