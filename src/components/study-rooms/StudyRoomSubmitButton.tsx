'use client'

import { LoaderCircle } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'

export function StudyRoomSubmitButton({
  children,
  className,
  name,
  pendingLabel = 'Working…',
  value,
}: {
  children: React.ReactNode
  className?: string
  name?: string
  pendingLabel?: string
  value?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-[#17453a] px-4 text-sm font-bold text-[#fffdf6] transition hover:bg-[#10372f] disabled:cursor-wait disabled:opacity-60',
        className,
      )}
      disabled={pending}
      name={name}
      type="submit"
      value={value}
    >
      {pending ? <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </button>
  )
}
