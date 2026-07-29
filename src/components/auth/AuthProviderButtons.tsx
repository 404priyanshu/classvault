import { Github, Phone } from 'lucide-react'
import Link from 'next/link'
import { signInWithOAuthAction } from '@/app/auth/actions'

type AuthProviderButtonsProps = {
  next?: string
  source: '/auth/sign-in' | '/auth/sign-up'
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.97-3.39.97-2.61 0-4.82-1.77-5.61-4.14H3.04v2.62A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.39 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6c1.47 0 2.79.5 3.82 1.49l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6 12 6Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function AuthProviderButtons({
  next = '/dashboard',
  source,
}: AuthProviderButtonsProps) {
  const phoneParams = new URLSearchParams({ next })

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <form action={signInWithOAuthAction}>
          <input name="next" type="hidden" value={next} />
          <input name="source" type="hidden" value={source} />
          <button
            className="flex h-11 w-full items-center justify-center gap-2 border-[1.5px] border-[#171512] bg-white px-3 text-sm font-black shadow-[2px_2px_0_#171512] transition-transform hover:-translate-y-0.5"
            name="provider"
            type="submit"
            value="google"
          >
            <GoogleMark />
            Google
          </button>
        </form>

        <form action={signInWithOAuthAction}>
          <input name="next" type="hidden" value={next} />
          <input name="source" type="hidden" value={source} />
          <button
            className="flex h-11 w-full items-center justify-center gap-2 border-[1.5px] border-[#171512] bg-white px-3 text-sm font-black shadow-[2px_2px_0_#171512] transition-transform hover:-translate-y-0.5"
            name="provider"
            type="submit"
            value="github"
          >
            <Github className="h-4 w-4" />
            GitHub
          </button>
        </form>
      </div>

      <Link
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 border-[1.5px] border-[#171512] bg-[#f6f1e5] px-3 text-sm font-black shadow-[2px_2px_0_#171512] transition-transform hover:-translate-y-0.5"
        href={`/auth/phone?${phoneParams.toString()}`}
      >
        <Phone className="h-4 w-4" />
        Continue with phone
      </Link>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[#171512]/20" />
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#171512]/45">
          or use email
        </span>
        <span className="h-px flex-1 bg-[#171512]/20" />
      </div>
    </>
  )
}
