'use client'

import { useFormStatus } from 'react-dom'

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
      className="btn-saffron mt-2 w-full rounded-full px-6 py-3 font-black disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  )
}
