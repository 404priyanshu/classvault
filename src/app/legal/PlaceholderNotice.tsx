import { AlertTriangle } from 'lucide-react'
import { hasPlaceholders } from './contact'

/**
 * Renders only while the operator and grievance details are unfinished, so an
 * incomplete legal page is obvious to the operator and honest to a reader.
 */
export function PlaceholderNotice() {
  if (!hasPlaceholders()) {
    return null
  }

  return (
    <div className="mb-10 flex gap-3 rounded-xl border-[1.5px] border-[#8a5a00] bg-[#f0a202]/15 p-5">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#8a5a00]" />
      <div className="text-sm font-medium leading-relaxed text-[#171512]/80">
        <p className="font-bold text-[#171512]">This page is not final.</p>
        <p className="mt-1">
          Operator, grievance-officer, and jurisdiction details are still marked{' '}
          <span className="font-bold">to be completed</span> in{' '}
          <code className="rounded bg-[#171512]/8 px-1 py-0.5">
            src/app/legal/contact.ts
          </code>
          . Fill them in and have a lawyer review this text before opening
          uploads to anyone outside the founding team.
        </p>
      </div>
    </div>
  )
}
