import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  Flag,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { getRequestClaims } from '@/lib/supabase/claims'
import { createClient } from '@/lib/supabase/server'
import { moderateNoteAction } from './actions'

export const dynamic = 'force-dynamic'

type ModerationPageProps = {
  searchParams: Promise<{ status?: string }>
}

type QueueItem = {
  category: string
  created_at: string
  details: string | null
  moderation_status: string
  note_id: string
  note_title: string
  note_visibility: string
  owner_label: string
  report_id: string
  report_status: string
  reporter_label: string
  university_name: string | null
}

const categoryLabels: Record<string, string> = {
  copyright: 'Copyright or ownership',
  unsafe_file: 'Unsafe or malicious file',
  wrong_scope: 'Wrong campus or access scope',
  misleading: 'Misleading or inaccurate',
  harassment: 'Harassment or personal data',
  spam: 'Spam or duplicate',
  other: 'Other',
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
})

function actionLabel(action: string) {
  return action
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function QueueCard({ item }: { item: QueueItem }) {
  return (
    <article className="rounded-3xl border border-club-line bg-club-paper p-5 [box-shadow:var(--elev-inline)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#9a3f2f]">
            <span className="inline-flex items-center gap-1.5">
              <Flag aria-hidden className="h-3.5 w-3.5" />
              {categoryLabels[item.category] || actionLabel(item.category)}
            </span>
            <span aria-hidden className="text-club-ink/25">/</span>
            <span className="text-club-muted">{item.report_status}</span>
          </div>
          <h2 className="font-display mt-2 text-2xl font-black leading-tight">
            {item.note_title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-club-muted">
            <span>Reported {dateFormatter.format(new Date(item.created_at))}</span>
            <span>by {item.reporter_label}</span>
            <span>owner: {item.owner_label}</span>
            <span className="inline-flex items-center gap-1 font-bold text-club-purple">
              {item.note_visibility === 'university' ? (
                <Building2 aria-hidden className="h-3.5 w-3.5" />
              ) : (
                <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
              )}
              {item.university_name || 'Public note'}
            </span>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-club-line bg-club-lavender px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-club-muted">
          <AlertTriangle aria-hidden className="h-3.5 w-3.5 text-[#b56d00]" />
          {item.moderation_status}
        </span>
      </div>

      {item.details ? (
        <blockquote className="mt-5 border-l-2 border-club-yellow bg-club-lavender px-4 py-3 text-sm leading-relaxed text-club-muted">
          {item.details}
        </blockquote>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 border-t border-club-line pt-5 lg:flex-row lg:items-end lg:justify-between">
        <Link
          className="inline-flex min-h-10 items-center gap-1.5 text-xs font-black text-club-purple underline decoration-club-yellow decoration-2 underline-offset-4"
          href={`/dashboard/notes/${item.note_id}`}
        >
          <Eye aria-hidden className="h-3.5 w-3.5" />
          Inspect note
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
        <form action={moderateNoteAction} className="grid gap-3 sm:grid-cols-2 lg:min-w-[620px] lg:grid-cols-[150px_150px_minmax(0,1fr)_auto]">
          <input name="noteId" type="hidden" value={item.note_id} />
          <label className="sr-only" htmlFor={`action-${item.report_id}`}>Moderation action</label>
          <select
            className="h-10 rounded-full border border-club-line bg-club-lavender px-2 text-xs font-bold outline-none focus:border-club-purple"
            defaultValue="start_review"
            id={`action-${item.report_id}`}
            name="action"
          >
            <option value="start_review">Start review</option>
            <option value="clear_review">Clear report</option>
            <option value="restrict">Restrict note</option>
            <option value="remove">Remove note</option>
            <option value="restore">Restore note</option>
            <option value="hold">Place retention hold</option>
            <option value="release_hold">Release retention hold</option>
          </select>
          <label className="sr-only" htmlFor={`reason-${item.report_id}`}>Reason code</label>
          <input
            className="h-10 rounded-full border border-club-line bg-club-lavender px-3 text-xs outline-none placeholder:text-club-muted focus:border-club-purple"
            defaultValue={item.category}
            id={`reason-${item.report_id}`}
            maxLength={80}
            name="reasonCode"
            placeholder="Reason code"
            required
          />
          <label className="sr-only" htmlFor={`message-${item.report_id}`}>Safe message for owner</label>
          <input
            className="h-10 rounded-full border border-club-line bg-club-lavender px-3 text-xs outline-none placeholder:text-club-muted focus:border-club-purple"
            id={`message-${item.report_id}`}
            maxLength={1000}
            name="safeOwnerMessage"
            placeholder="Optional owner-facing message"
          />
          <button className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-club-purple bg-club-purple px-3 text-xs font-black text-club-paper [box-shadow:var(--elev-inline)] hover:-translate-y-0.5" type="submit">
            <ShieldAlert aria-hidden className="h-3.5 w-3.5" />
            Save
          </button>
        </form>
      </div>
    </article>
  )
}

export default async function ModerationPage({ searchParams }: ModerationPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const claims = await getRequestClaims()
  if (!claims) redirect('/auth/sign-in?next=/dashboard/moderation')

  const { data, error } = await supabase.rpc('list_moderation_queue', { p_limit: 100 })
  if (error) throw new Error('The moderation queue could not be loaded.')
  const items = (data || []) as QueueItem[]

  return (
    <div className="mx-auto max-w-[1320px] space-y-4">
      <AuthMessage status={params.status} />
      <PageHeader
        action={
          <span className="inline-flex items-center gap-2 rounded-xl border border-club-line bg-club-paper px-3 py-2 text-xs font-black text-club-purple">
            <Flag aria-hidden className="h-4 w-4" />
            {items.length} open {items.length === 1 ? 'report' : 'reports'}
          </span>
        }
        description="Review reports for notes in your campus scope. Platform moderators can see the full queue."
        title="Moderation"
      />

      {items.length ? (
        <section className="space-y-4" aria-label="Open moderation reports">
          {items.map((item) => <QueueCard item={item} key={item.report_id} />)}
        </section>
      ) : (
        <section className="grid min-h-[360px] place-items-center rounded-xl border border-club-line bg-club-paper px-6 py-12 text-center">
          <div className="max-w-md">
            <CheckCircle2 aria-hidden className="mx-auto h-12 w-12 text-[#2d7c58]" strokeWidth={1.35} />
            <h2 className="font-display mt-4 text-3xl font-black">Queue is clear</h2>
            <p className="mt-2 text-sm leading-relaxed text-club-muted">New private reports will appear here when a student flags an accessible note.</p>
          </div>
        </section>
      )}

      <p className="inline-flex items-center gap-2 text-xs leading-relaxed text-club-muted"><XCircle aria-hidden className="h-4 w-4 text-[#9a3f2f]" /> Actions are audited. Owners see only the safe message you provide, never reporter identity or internal reason codes.</p>
    </div>
  )
}
