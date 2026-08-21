'use client'

import { FileText, RotateCcw, Save, Send } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { stageLabels, type PendingCompletion, type UploadStage } from './use-note-upload'

export function UploadFormFooter({
  error,
  isPending,
  pendingCompletion,
  stage,
  tagCount,
}: {
  error: string | null
  isPending: boolean
  pendingCompletion: PendingCompletion | null
  stage: UploadStage
  tagCount: number
}) {
  return (
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
  )
}
