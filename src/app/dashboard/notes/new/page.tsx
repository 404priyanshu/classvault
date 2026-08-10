import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { UploadNoteForm } from '@/components/notes/UploadNoteForm'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/app/auth/actions'

export const dynamic = 'force-dynamic'

export default async function NewNotePage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims

  if (!claims) {
    redirect('/auth/sign-in?next=/dashboard/notes/new')
  }

  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, university_name, onboarding_completed_at')
      .eq('id', claims.sub)
      .maybeSingle(),
    supabase
      .from('university_memberships')
      .select('status, university_id')
      .eq('user_id', claims.sub)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const membership = membershipResult.data

  if (!profile?.onboarding_completed_at) {
    redirect('/onboarding')
  }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('code, id, name, university_id')
    .eq('is_active', true)
    .order('name')

  return (
    <main className="paper-grain relative min-h-screen overflow-hidden bg-[#f6f1e5] text-[#171512]">
      <div className="bg-dotgrid pointer-events-none absolute inset-0 opacity-45" />
      <header className="relative border-b-[1.5px] border-[#171512] bg-[#fffdf6]/95 px-5 py-4 shadow-[0_3px_0_rgba(23,21,18,0.08)] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-lg border-[1.5px] border-[#171512] bg-[#17453a] shadow-[3px_3px_0_#171512]">
              <BookOpen className="h-5 w-5 text-[#f6f1e5]" />
            </span>
            <span className="font-display text-xl font-black">
              Class<span className="text-[#17453a]">Vault</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              className="flex min-h-10 items-center gap-2 px-2 text-sm font-black text-[#17453a] transition-transform hover:-translate-x-1"
              href="/dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to vault
            </Link>
            <form action={signOutAction}>
              <SignOutButton />
            </form>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <UploadNoteForm
          hasVerifiedUniversity={membership?.status === 'verified'}
          subjects={subjects || []}
          universityName={profile.university_name}
        />
      </div>
    </main>
  )
}
