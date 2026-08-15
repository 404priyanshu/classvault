import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '../auth/actions'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    redirect('/auth/sign-in?next=/dashboard')
  }

  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, university_name, course, onboarding_completed_at')
      .eq('id', claims.sub)
      .maybeSingle(),
    supabase
      .from('university_memberships')
      .select('status')
      .eq('user_id', claims.sub)
      .maybeSingle(),
  ])

  const profile = profileResult.data

  if (!profile?.onboarding_completed_at) {
    redirect('/onboarding')
  }

  const email =
    typeof claims.email === 'string' && claims.email ? claims.email : null
  const phone =
    typeof claims.phone === 'string' && claims.phone ? claims.phone : null
  const displayName =
    profile.display_name || (email ? email.split('@')[0] : phone || 'Student')

  return (
    <DashboardShell
      course={profile.course}
      displayName={displayName}
      membershipStatus={membershipResult.data?.status || 'pending'}
      signOutControl={
        <form action={signOutAction}>
          <SignOutButton />
        </form>
      }
      universityName={profile.university_name}
    >
      {children}
    </DashboardShell>
  )
}
