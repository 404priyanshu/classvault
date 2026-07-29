'use client'

import { useFormStatus } from 'react-dom'
import { Spinner } from '@/components/ui/spinner'

export function SignOutButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className="flex min-h-10 items-center justify-center gap-2 rounded-full border-[1.5px] border-[#171512] bg-[#fffdf6] px-5 py-2 text-sm font-black shadow-[3px_3px_0_#171512] transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <Spinner className="size-5" decorative size={20} />
      ) : null}
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
