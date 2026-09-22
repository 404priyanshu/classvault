import { redirect } from 'next/navigation'
import { CircleSlash } from 'lucide-react'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { getRequestClaims } from '@/lib/supabase/claims'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '../auth/actions'

export const dynamic = 'force-dynamic'

const decidedDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/**
 * The only page a suspended student can reach.
 *
 * It sits outside /dashboard on purpose: the dashboard layout redirects here
 * unconditionally, which it could not do if this lived inside the layout it
 * redirects from. A student who is not suspended is sent back, so the route is
 * not a way to fake a suspension notice.
 */
export default async function SuspendedPage() {
  const claims = await getRequestClaims()
  if (!claims) redirect('/auth/sign-in?next=/suspended')

  const supabase = await createClient()
  const [statusResult, profileResult] = await Promise.all([
    supabase.rpc('get_own_account_status'),
    supabase
      .from('profiles')
      .select('display_name, university_name, course')
      .eq('id', claims.sub)
      .maybeSingle(),
  ])

  const status = statusResult.data?.[0]
  if (!status?.suspended) redirect('/dashboard')

  const profile = profileResult.data
  const email = typeof claims.email === 'string' ? claims.email : null

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-club-line bg-club-paper p-6 [box-shadow:var(--elev-inline)] sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#9a3328]/40 bg-[#fff2ef] px-3 py-1 text-[11px] font-black uppercase tracking-[0.09em] text-[#9a3328]">
          <CircleSlash aria-hidden className="h-3.5 w-3.5" />
          Account suspended
        </span>

        <h1 className="app-title mt-4">Your account is on hold.</h1>

        <p className="mt-4 text-sm leading-relaxed text-club-muted">
          A ClassVault administrator has suspended access to this account. You
          cannot upload, rate, generate plans, or join rooms while the
          suspension is in place.
        </p>

        <div className="mt-5 rounded-2xl border border-club-line bg-white/70 p-4">
          <h2 className="text-xs font-black uppercase tracking-[0.08em]">Reason given</h2>
          <p className="mt-2 text-sm leading-relaxed text-club-ink/80">
            {status.suspension_reason}
          </p>
          {status.suspended_at ? (
            <p className="mt-2 text-xs text-club-muted">
              Applied {decidedDateFormatter.format(new Date(status.suspended_at))}
            </p>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl border border-club-line bg-club-lavender p-4">
          <h2 className="text-xs font-black uppercase tracking-[0.08em]">This account</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-bold">Name</dt>
              <dd className="text-club-ink/80">{profile?.display_name || '—'}</dd>
            </div>
            {email ? (
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-bold">Email</dt>
                <dd className="text-club-ink/80">{email}</dd>
              </div>
            ) : null}
            {profile?.university_name ? (
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-bold">Campus</dt>
                <dd className="text-club-ink/80">{profile.university_name}</dd>
              </div>
            ) : null}
            {profile?.course ? (
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-bold">Course</dt>
                <dd className="text-club-ink/80">{profile.course}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-club-muted">
          Your notes and anything you have already shared stay where they are —
          a suspension restricts your access, it does not delete your work. To
          appeal, reply to the email address ClassVault contacted you from.
        </p>

        <div className="mt-6">
          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </div>
      </div>
    </main>
  )
}
