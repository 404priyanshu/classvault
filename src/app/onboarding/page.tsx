import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type OnboardingPageProps = {
  searchParams: Promise<{ edit?: string }>
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const { edit } = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims

  if (!claims) {
    redirect('/auth/sign-in?next=/onboarding')
  }

  const profileRequest = supabase
    .from('profiles')
    .select(
      'display_name, course, graduation_year, primary_goal, study_preference, onboarding_completed_at',
    )
    .eq('id', claims.sub)
    .maybeSingle()

  const membershipRequest = supabase
    .from('university_memberships')
    .select('university_id')
    .eq('user_id', claims.sub)
    .maybeSingle()

  const universitiesRequest = supabase
    .from('universities')
    .select('id, name, short_name, city, state')
    .eq('is_active', true)
    .order('name')

  const domainsRequest = supabase
    .from('university_email_domains')
    .select('university_id, domain')

  const [
    { data: profile },
    { data: membership },
    { data: universities, error: universitiesError },
    { data: domains, error: domainsError },
  ] = await Promise.all([
    profileRequest,
    membershipRequest,
    universitiesRequest,
    domainsRequest,
  ])

  if (profile?.onboarding_completed_at && edit !== '1') {
    redirect('/dashboard')
  }

  if (universitiesError || domainsError || !universities?.length) {
    throw new Error('University onboarding data is unavailable.')
  }

  const domainsByUniversity = new Map<number, string[]>()

  domains?.forEach(({ domain, university_id: universityId }) => {
    const existing = domainsByUniversity.get(universityId) || []
    existing.push(domain)
    domainsByUniversity.set(universityId, existing)
  })

  const email =
    typeof claims.email === 'string' ? claims.email : 'Your confirmed email'

  return (
    <OnboardingFlow
      accountEmail={email}
      initialProfile={{
        course: profile?.course || '',
        displayName: profile?.display_name || '',
        graduationYear:
          profile?.graduation_year || new Date().getFullYear() + 3,
        primaryGoal: profile?.primary_goal || 'stay_consistent',
        studyPreference: profile?.study_preference || 'accountability',
        universityId: membership?.university_id || null,
      }}
      isEditing={edit === '1'}
      universities={universities.map((university) => ({
        city: university.city,
        domains: domainsByUniversity.get(university.id) || [],
        id: university.id,
        name: university.name,
        shortName: university.short_name,
        state: university.state,
      }))}
    />
  )
}
