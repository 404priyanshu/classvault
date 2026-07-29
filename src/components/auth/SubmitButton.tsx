'use client'

import { useFormStatus } from 'react-dom'
import { Spinner } from '@/components/ui/spinner'

type SubmitButtonProps = {
  idleLabel: string
  pendingLabel: string
}

export function SubmitButton({
  idleLabel,
  pendingLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      className="btn-saffron mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-black disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <Spinner className="size-6" decorative size={24} />
      ) : null}
      {pending ? pendingLabel : idleLabel}
    </button>
  )
}
