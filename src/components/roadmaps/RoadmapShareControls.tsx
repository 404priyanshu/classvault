'use client'

import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Check, Copy, Link2, LockKeyhole } from 'lucide-react'
import { setRoadmapSharingAction } from '@/app/dashboard/roadmaps/actions'
import { Spinner } from '@/components/ui/spinner'

function SubmitButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      className={
        enabled
          ? 'inline-flex items-center gap-2 rounded-full border border-club-ink bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-club-yellow disabled:opacity-50'
          : 'inline-flex items-center gap-2 rounded-full bg-club-purple px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50'
      }
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <Spinner decorative size={16} />
      ) : enabled ? (
        <LockKeyhole aria-hidden className="h-4 w-4" />
      ) : (
        <Link2 aria-hidden className="h-4 w-4" />
      )}
      {enabled ? 'Stop sharing' : 'Create share link'}
    </button>
  )
}

/**
 * The link is a capability: anyone holding it can read the roadmap, so the
 * copy control shows the whole URL rather than hiding it behind a button that
 * silently puts a secret on the clipboard.
 */
function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-club-ink bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-club-yellow"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
        } catch {
          // Clipboard access can be refused; the URL is on screen to copy by hand.
          setCopied(false)
        }
      }}
      type="button"
    >
      {copied ? (
        <Check aria-hidden className="h-3.5 w-3.5 text-club-purple" strokeWidth={3} />
      ) : (
        <Copy aria-hidden className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}

export function RoadmapShareControls({
  roadmapId,
  shareUrl,
  sharingEnabled,
}: {
  roadmapId: string
  shareUrl: string | null
  sharingEnabled: boolean
}) {
  return (
    <div className="mt-5 rounded-2xl border border-club-line bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Share this plan</h2>
          <p className="mt-1 max-w-prose text-xs text-club-ink/70">
            {sharingEnabled
              ? 'Anyone with the link can read this plan. Sections built from notes they cannot access stay hidden, and your task progress is never shared.'
              : 'Off by default. A link lets others read the plan without signing in, but only the sections whose source notes they are allowed to read.'}
          </p>
        </div>
        <form action={setRoadmapSharingAction}>
          <input name="enabled" type="hidden" value={sharingEnabled ? 'false' : 'true'} />
          <input name="roadmapId" type="hidden" value={roadmapId} />
          <SubmitButton enabled={sharingEnabled} />
        </form>
      </div>

      {sharingEnabled && shareUrl ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-club-line bg-club-paper px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-xs text-club-ink/80">{shareUrl}</code>
          <CopyLinkButton url={shareUrl} />
        </div>
      ) : null}
    </div>
  )
}
