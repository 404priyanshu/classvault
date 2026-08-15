import { redirect } from 'next/navigation'
import { UploadNoteForm } from '@/components/notes/UploadNoteForm'
import { createClient } from '@/lib/supabase/server'

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
    <div className="mx-auto max-w-7xl">
      <UploadNoteForm
        hasVerifiedUniversity={membership?.status === 'verified'}
        subjects={subjects || []}
        universityName={profile.university_name}
      />
    </div>
  )
}
