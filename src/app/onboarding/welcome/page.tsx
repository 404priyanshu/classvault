import { redirect } from 'next/navigation'
import { WelcomeExperience } from '@/components/journey/WelcomeExperience'
import { getRequestClaims } from '@/lib/supabase/claims'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function WelcomePage() {
  const supabase = await createClient()
  const claims = await getRequestClaims()
  if (!claims) redirect('/auth/sign-in?next=/onboarding/welcome')
  const [
    { data: profile, error: profileError },
    { data: membership, error: membershipError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, primary_goal, onboarding_completed_at')
      .eq('id', claims.sub)
      .maybeSingle(),
    supabase
      .from('university_memberships')
      .select('university_id, status')
      .eq('user_id', claims.sub)
      .maybeSingle(),
  ])
  if (profileError || membershipError)
    throw new Error('Your saved profile could not be loaded. Please try again.')
  if (!profile?.onboarding_completed_at || !membership) redirect('/onboarding')
  const [{ data: university, error: universityError }, notesResult] =
    await Promise.all([
      supabase
        .from('universities')
        .select('name')
        .eq('id', membership.university_id)
        .maybeSingle(),
      supabase.rpc('list_notes_for_library', {
        p_access: 'public',
        p_limit: 2,
        p_note_type: 'all',
        p_offset: 0,
        p_query: '',
        p_sort: 'top',
        p_subject_id: null as unknown as number,
      }),
    ])
  if (universityError || !university)
    throw new Error('Your university could not be loaded. Please try again.')
  return (
    <WelcomeExperience
      userId={claims.sub}
      displayName={profile.display_name || 'friend'}
      university={university.name}
      goal={profile.primary_goal || ''}
      verified={membership.status === 'verified'}
      notesUnavailable={!!notesResult.error}
      notes={(notesResult.data || []).map((note) => ({
        id: note.id,
        title: note.title,
        subject: note.subject_name || 'Student notes',
      }))}
    />
  )
}
