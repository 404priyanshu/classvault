'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyAccountId({ accountId }: { accountId: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  return (
    <button
      className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#bfb39d] bg-[#fffdf6] px-3 text-xs font-bold transition hover:border-[#17453a] hover:bg-[#eef4ed]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(accountId)
          setStatus('copied')
        } catch {
          setStatus('error')
        }
        window.setTimeout(() => setStatus('idle'), 1800)
      }}
      type="button"
    >
      {status === 'copied' ? (
        <Check aria-hidden className="h-3.5 w-3.5 text-[#246447]" />
      ) : (
        <Copy aria-hidden className="h-3.5 w-3.5" />
      )}
      {status === 'copied'
        ? 'Copied'
        : status === 'error'
          ? 'Copy failed'
          : 'Copy ID'}
    </button>
  )
}
