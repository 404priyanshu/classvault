import Link from 'next/link'
import { BookOpen, CheckCircle2, LockKeyhole, UserRound } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '../auth/actions'

export const dynamic = 'force-dynamic'

type DashboardPageProps = {
  searchParams: Promise<{ status?: string }>
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    redirect('/auth/sign-in?next=/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, university_name, course, graduation_year')
    .eq('id', claims.sub)
    .maybeSingle()

  const email = typeof claims.email === 'string' ? claims.email : 'Signed-in user'
  const displayName = profile?.display_name || email.split('@')[0]

  return (
    <main className="paper-grain relative min-h-screen overflow-hidden bg-[#f6f1e5] px-5 py-8 text-[#171512]">
      <div className="bg-dotgrid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-lg border-[1.5px] border-[#171512] bg-[#17453a] shadow-[3px_3px_0_#171512]">
              <BookOpen className="h-5 w-5 text-[#f6f1e5]" />
            </span>
            <span className="font-display text-xl font-black">
              Class<span className="text-[#17453a]">Vault</span>
            </span>
          </Link>
          <form action={signOutAction}>
            <button
              className="rounded-full border-[1.5px] border-[#171512] bg-[#fffdf6] px-5 py-2 text-sm font-black shadow-[3px_3px_0_#171512] transition-transform hover:-translate-y-0.5"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="mt-16">
          <AuthMessage status={status} />
          <span className="stamp bg-[#fffdf6] text-[#17453a]">Private beta</span>
          <h1 className="font-display mt-5 max-w-3xl text-5xl font-black leading-[0.95] sm:text-7xl">
            Welcome to your vault,{' '}
            <span className="italic text-[#17453a]">{displayName}.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#171512]/65">
            Authentication and your private profile are connected. Product
            modules will appear here as notes, roadmaps, and study rooms move
            beyond the landing-page prototype.
          </p>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <article className="paper-card bg-[#fffdf6] p-6">
            <CheckCircle2 className="h-8 w-8 text-[#17453a]" />
            <h2 className="font-display mt-4 text-2xl font-black">Session ready</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#171512]/60">
              Supabase Auth issued a cookie-backed session validated on the
              server.
            </p>
          </article>
          <article className="paper-card bg-[#fffdf6] p-6">
            <UserRound className="h-8 w-8 text-[#17453a]" />
            <h2 className="font-display mt-4 text-2xl font-black">Profile ready</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#171512]/60">
              {profile
                ? 'Your row-level secured profile was loaded.'
                : 'Apply the database migration to create your secured profile.'}
            </p>
          </article>
          <article className="paper-card bg-[#fffdf6] p-6">
            <LockKeyhole className="h-8 w-8 text-[#17453a]" />
            <h2 className="font-display mt-4 text-2xl font-black">
              Access scoped
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#171512]/60">
              Database policy allows each student to read and update only their
              own profile.
            </p>
          </article>
        </section>

        <aside className="mt-10 border-[1.5px] border-dashed border-[#171512]/35 bg-[#f0a202]/15 p-5 text-sm">
          Signed in as <strong>{email}</strong>
          {profile?.university_name ? (
            <>
              {' '}
              · {profile.university_name}
              {profile.course ? ` · ${profile.course}` : ''}
              {profile.graduation_year ? ` · Class of ${profile.graduation_year}` : ''}
            </>
          ) : null}
        </aside>
      </div>
    </main>
  )
}
