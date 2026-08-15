import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Download,
  FileCheck2,
  FileText,
  Globe2,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react'
import { formatFileSize, formatNoteType } from '@/lib/notes/library'
import {
  createAccessibleNoteFileUrl,
  getAccessibleNoteFile,
} from '@/lib/notes/storage/access'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type NoteDetailPageProps = {
  params: Promise<{ noteId: string }>
}

type NoteDetailRow = {
  description: string | null
  id: string
  note_type: string
  owner_id: string
  published_at: string | null
  subjects: { code: string | null; name: string } | null
  tags: string[]
  title: string
  universities: { name: string; short_name: string | null } | null
  visibility: string
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { noteId } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select(
      'id, owner_id, title, description, note_type, tags, visibility, published_at, subjects(code, name), universities(name, short_name)',
    )
    .eq('id', noteId)
    .eq('publication_status', 'published')
    .in('moderation_status', ['clear', 'under_review'])
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) notFound()

  const note = data as NoteDetailRow
  if (!note.published_at || !note.subjects) notFound()

  const [contributorResult, ratingResult, file] = await Promise.all([
    supabase.rpc('get_accessible_note_contributors', {
      p_note_ids: [note.id],
    }),
    supabase
      .from('note_rating_summaries')
      .select('average_rating, rating_count')
      .eq('note_id', note.id)
      .maybeSingle(),
    getAccessibleNoteFile(supabase, note.id),
  ])
  const contributor = contributorResult.data?.[0]
  const rating = ratingResult.data
  const averageRating =
    rating?.average_rating === null || rating?.average_rating === undefined
      ? null
      : Number(rating.average_rating)
  let previewUrl: string | null = null

  if (file) {
    try {
      previewUrl = await createAccessibleNoteFileUrl(supabase, file)
    } catch {
      previewUrl = null
    }
  }

  const isCampusNote = note.visibility === 'university'
  const accessName = isCampusNote
    ? note.universities?.short_name || note.universities?.name || 'Campus only'
    : 'Public note'

  return (
    <article className="mx-auto max-w-[1320px]">
      <Link
        className="inline-flex min-h-10 items-center gap-2 text-sm font-black text-[#17453a] underline decoration-[#f0a202] decoration-2 underline-offset-4"
        href="/dashboard/notes"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to library
      </Link>

      <header className="mt-4 border-b border-[#cfc4ae] pb-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-black uppercase tracking-[0.09em] text-[#17453a]">
              <span>{note.subjects.code || note.subjects.name}</span>
              <span aria-hidden className="text-[#171512]/30">
                /
              </span>
              <span className="text-[#171512]/55">
                {formatNoteType(note.note_type)}
              </span>
            </div>
            <h1 className="font-display mt-2 text-4xl font-black leading-[1.05] sm:text-5xl">
              {note.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#171512]/60">
              <span>by {contributor?.display_name || 'ClassVault student'}</span>
              <span aria-hidden className="h-1 w-1 bg-[#171512]/25" />
              <time dateTime={note.published_at}>
                Published {dateFormatter.format(new Date(note.published_at))}
              </time>
              <span aria-hidden className="h-1 w-1 bg-[#171512]/25" />
              <span className="inline-flex items-center gap-1.5 font-bold text-[#17453a]">
                {isCampusNote ? (
                  <Building2 aria-hidden className="h-4 w-4" />
                ) : (
                  <Globe2 aria-hidden className="h-4 w-4" />
                )}
                {accessName}
              </span>
            </div>
          </div>

          {file ? (
            <a
              className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 border border-[#171512] bg-[#17453a] px-5 text-sm font-black text-[#fffdf6] shadow-[4px_4px_0_#171512] transition-transform hover:-translate-y-0.5 sm:w-auto"
              href={`/dashboard/notes/${note.id}/download`}
            >
              <Download aria-hidden className="h-[18px] w-[18px]" />
              Download note
            </a>
          ) : (
            <span className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#bfb39d] bg-[#e9e2d4] px-5 text-sm font-bold text-[#171512]/45">
              <FileText aria-hidden className="h-[18px] w-[18px]" />
              File unavailable
            </span>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="preview-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-b-0 border-[#cfc4ae] bg-[#fffdf6] px-4 py-3 sm:px-5">
            <div>
              <h2 className="font-display text-xl font-black" id="preview-heading">
                Note preview
              </h2>
              <p className="mt-0.5 text-[11px] text-[#171512]/50">
                Private file link expires automatically.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17453a]">
              <ShieldCheck aria-hidden className="h-4 w-4" />
              Access checked
            </span>
          </div>

          <div className="relative min-h-[520px] border border-[#cfc4ae] bg-[#e9e3d7] p-2 shadow-[4px_4px_0_rgba(23,21,18,0.1)] sm:min-h-[680px] sm:p-3">
            {previewUrl && file ? (
              <object
                className="h-[70vh] min-h-[500px] w-full bg-white sm:min-h-[650px]"
                data={previewUrl}
                title={`Preview of ${note.title}`}
                type={file.mimeType}
              >
                <div className="grid h-full min-h-[500px] place-items-center bg-[#fffdf6] p-8 text-center">
                  <p className="max-w-sm text-sm text-[#171512]/60">
                    This browser could not display the note preview. Download the
                    original file to read it.
                  </p>
                </div>
              </object>
            ) : (
              <div className="bg-ruled grid min-h-[500px] place-items-center bg-[#fffdf6] p-8 text-center sm:min-h-[650px]">
                <div className="max-w-sm">
                  <FileText
                    aria-hidden
                    className="mx-auto h-12 w-12 text-[#17453a]"
                    strokeWidth={1.35}
                  />
                  <h3 className="font-display mt-4 text-2xl font-black">
                    Preview unavailable
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#171512]/60">
                    The metadata is available, but the private file could not be
                    previewed right now. Try downloading it instead.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4" aria-label="Note details">
          <section className="border border-[#cfc4ae] bg-[#fffdf6] p-5">
            <h2 className="font-display text-xl font-black">About this note</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#171512]/65">
              {note.description || 'The contributor did not add a description.'}
            </p>
          </section>

          <section className="border border-[#cfc4ae] bg-[#fffdf6] p-5">
            <h2 className="font-display text-xl font-black">Details</h2>
            <dl className="mt-4 divide-y divide-[#e1d8c6] text-sm">
              <div className="grid grid-cols-[24px_96px_1fr] gap-2 py-3 first:pt-0">
                <UserRound aria-hidden className="mt-0.5 h-4 w-4 text-[#17453a]" />
                <dt className="font-semibold text-[#171512]/55">Contributor</dt>
                <dd className="text-right font-bold">
                  {contributor?.display_name || 'ClassVault student'}
                </dd>
              </div>
              <div className="grid grid-cols-[24px_96px_1fr] gap-2 py-3">
                <Star
                  aria-hidden
                  className="mt-0.5 h-4 w-4 fill-[#f0a202] text-[#b56d00]"
                />
                <dt className="font-semibold text-[#171512]/55">Rating</dt>
                <dd className="text-right font-bold">
                  {averageRating === null
                    ? 'Unrated'
                    : `${averageRating.toFixed(1)} · ${rating?.rating_count || 0} ratings`}
                </dd>
              </div>
              <div className="grid grid-cols-[24px_96px_1fr] gap-2 py-3">
                <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 text-[#17453a]" />
                <dt className="font-semibold text-[#171512]/55">Access</dt>
                <dd className="text-right font-bold">{accessName}</dd>
              </div>
              {file ? (
                <div className="grid grid-cols-[24px_96px_1fr] gap-2 py-3 last:pb-0">
                  <FileCheck2 aria-hidden className="mt-0.5 h-4 w-4 text-[#17453a]" />
                  <dt className="font-semibold text-[#171512]/55">File</dt>
                  <dd className="text-right font-bold">
                    {file.mimeType === 'application/pdf' ? 'PDF' : 'Image'} ·{' '}
                    {formatFileSize(file.byteSize)}
                    {file.pageCount ? ` · ${file.pageCount} pages` : ''}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {note.tags.length > 0 ? (
            <section className="border border-[#cfc4ae] bg-[#fffdf6] p-5">
              <h2 className="font-display text-xl font-black">Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    className="border border-[#bfb39d] bg-[#f8f2e5] px-2.5 py-1 text-xs font-bold text-[#17453a]"
                    key={tag}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </article>
  )
}
