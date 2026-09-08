'use client'

import { useState } from 'react'
import { Flag, LoaderCircle, Send, X } from 'lucide-react'
import {
  submitNoteReportAction,
  type NoteReportResult,
} from '@/app/dashboard/notes/[noteId]/actions'

const categories = [
  ['copyright', 'Copyright or ownership'],
  ['unsafe_file', 'Unsafe or malicious file'],
  ['wrong_scope', 'Wrong campus or access scope'],
  ['misleading', 'Misleading or inaccurate'],
  ['harassment', 'Harassment or personal data'],
  ['spam', 'Spam or duplicate'],
  ['other', 'Something else'],
] as const

export function ReportNoteForm({ noteId }: { noteId: string }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('copyright')
  const [details, setDetails] = useState('')
  const [result, setResult] = useState<NoteReportResult | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const next = await submitNoteReportAction({ category, details, noteId })
    setResult(next)
    setPending(false)
    if (next.ok) {
      setDetails('')
      setOpen(false)
    }
  }

  return (
    <section className="rounded-3xl border border-club-line bg-club-paper p-5">
      {!open ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-black">Something not right?</h2>
            <p className="mt-2 text-sm leading-relaxed text-club-muted">
              Flag a note privately for the ClassVault moderation team. Your identity
              is never shown to the contributor.
            </p>
          </div>
          <button
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-club-line bg-club-lavender px-3 text-xs font-black text-[#9a3f2f] transition-colors hover:border-[#9a3f2f]"
            onClick={() => {
              setResult(null)
              setOpen(true)
            }}
            type="button"
          >
            <Flag aria-hidden className="h-3.5 w-3.5" />
            Report note
          </button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-black">Report this note</h2>
              <p className="mt-1 text-xs leading-relaxed text-club-muted">
                Reports are private and reviewed by scoped moderators.
              </p>
            </div>
            <button
              aria-label="Close report form"
              className="grid h-8 w-8 shrink-0 place-items-center text-club-muted hover:text-club-ink"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>

          <label className="block text-sm font-bold text-club-ink">
            Reason
            <select
              className="mt-2 h-11 w-full rounded-full border border-club-line bg-club-lavender px-3 text-sm font-semibold outline-none focus:border-club-purple focus:ring-2 focus:ring-club-purple/15"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-bold text-club-ink">
            Details <span className="font-normal text-club-muted">(optional)</span>
            <textarea
              className="mt-2 min-h-24 w-full resize-y border border-club-line bg-club-lavender p-3 text-sm outline-none placeholder:text-club-muted focus:border-club-purple focus:ring-2 focus:ring-club-purple/15"
              maxLength={2000}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Tell the moderators what they should check."
              value={details}
            />
            <span className="mt-1 block text-right text-[11px] text-club-muted">
              {details.length}/2000
            </span>
          </label>

          {result && !result.ok ? (
            <p className="border border-red-900/30 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900" role="alert">
              {result.error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              className="min-h-10 px-3 text-xs font-black text-club-muted hover:text-club-ink"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-1.5 border border-club-ink bg-[#9a3f2f] px-4 text-xs font-black text-club-paper [box-shadow:var(--elev-inline)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-65"
              disabled={pending}
              type="submit"
            >
              {pending ? (
                <LoaderCircle aria-hidden className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send aria-hidden className="h-3.5 w-3.5" />
              )}
              {pending ? 'Sending…' : 'Send private report'}
            </button>
          </div>
        </form>
      )}
      {result?.ok ? (
        <p className="mt-3 text-sm font-semibold text-club-purple" role="status">
          Thanks — the moderation team has your report.
        </p>
      ) : null}
    </section>
  )
}
