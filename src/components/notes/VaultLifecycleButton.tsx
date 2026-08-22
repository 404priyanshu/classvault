'use client'

import { useFormStatus } from 'react-dom'
import { LoaderCircle, RotateCcw, Trash2 } from 'lucide-react'

function PendingLabel({ restore }: { restore: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <LoaderCircle aria-hidden className="h-3.5 w-3.5 animate-spin" />
      {restore ? 'Restoring…' : 'Moving…'}
    </span>
  )
}

function SubmitButton({ restore }: { restore: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      className={
        restore
          ? 'inline-flex min-h-10 items-center justify-center gap-2 border border-[#17453a] bg-[#17453a] px-3 text-xs font-black text-[#fffdf6] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-65'
          : 'inline-flex min-h-10 items-center justify-center gap-2 border border-[#bfb39d] bg-[#fffdf6] px-3 text-xs font-black text-[#9a3f2f] transition-colors hover:border-[#9a3f2f] disabled:cursor-wait disabled:opacity-65'
      }
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <PendingLabel restore={restore} />
      ) : restore ? (
        <>
          <RotateCcw aria-hidden className="h-3.5 w-3.5" />
          Restore note
        </>
      ) : (
        <>
          <Trash2 aria-hidden className="h-3.5 w-3.5" />
          Move to Trash
        </>
      )}
    </button>
  )
}

export function VaultLifecycleButton({
  action,
  noteId,
  restore = false,
}: {
  action: (formData: FormData) => void | Promise<void>
  noteId: string
  restore?: boolean
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !restore &&
          !window.confirm(
            'Move this note to Trash? It will disappear from the library and remain recoverable for 30 days.',
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input name="noteId" type="hidden" value={noteId} />
      <SubmitButton restore={restore} />
    </form>
  )
}
