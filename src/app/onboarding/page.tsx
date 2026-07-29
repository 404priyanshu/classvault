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

  if (universitiesError || !universities?.length) {
    console.error('Unable to load the university directory.', {
      code: universitiesError?.code,
      details: universitiesError?.details,
      hint: universitiesError?.hint,
      message: universitiesError?.message,
    })
    throw new Error('University onboarding data is unavailable.')
  }

  if (domainsError) {
    console.error('Unable to load university email domains.', {
      code: domainsError.code,
      details: domainsError.details,
      hint: domainsError.hint,
      message: domainsError.message,
    })
  }

  const domainsByUniversity = new Map<number, string[]>()

  domains?.forEach(({ domain, university_id: universityId }) => {
    const existing = domainsByUniversity.get(universityId) || []
    existing.push(domain)
    domainsByUniversity.set(universityId, existing)
  })

  const accountEmail =
    typeof claims.email === 'string' && claims.email ? claims.email : null
  const accountPhone =
    typeof claims.phone === 'string' && claims.phone ? claims.phone : null
  const accountIdentifier =
    accountEmail || accountPhone || 'Authenticated ClassVault account'

  return (
    <OnboardingFlow
      accountEmail={accountEmail}
      accountIdentifier={accountIdentifier}
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
