'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { isEmailOnDomains } from '@/lib/auth/college-email'
import { getSiteUrl } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  enrolmentId: z.string().trim().min(4).max(60),
  context: z.string().trim().max(1000),
})

const reviewSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  evidenceMethod: z.enum([
    'roster_check',
    'campus_staff_confirmation',
    'insufficient_evidence',
  ]),
  reason: z.string().trim().min(10).max(500),
}).refine(
  ({ decision, evidenceMethod }) =>
    decision === 'approved'
      ? evidenceMethod !== 'insufficient_evidence'
      : evidenceMethod === 'insufficient_evidence',
)

const collegeEmailSchema = z.string().trim().toLowerCase().email().max(254)

function resultUrl(message: string) {
  return `/dashboard/verification?status=${encodeURIComponent(message)}`
}

export async function submitMembershipVerificationAction(formData: FormData) {
  const parsed = requestSchema.safeParse({
    enrolmentId: formData.get('enrolmentId'),
    context: formData.get('context') || '',
  })
  if (!parsed.success) redirect(resultUrl('Check your enrolment details and try again.'))

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/auth/sign-in?next=/dashboard/verification')

  const { error } = await supabase.rpc('submit_membership_verification_request', {
    p_enrolment_id: parsed.data.enrolmentId,
    p_student_context: parsed.data.context,
  })
  if (error) {
    const message = error.message.includes('already pending')
      ? 'Your request is already in review.'
      : 'Your request could not be submitted. Please try again.'
    redirect(resultUrl(message))
  }

  revalidatePath('/dashboard/verification')
  revalidatePath('/dashboard/settings')
  redirect(resultUrl('Your campus verification request was submitted.'))
}

export async function reviewMembershipVerificationAction(formData: FormData) {
  const parsed = reviewSchema.safeParse({
    requestId: formData.get('requestId'),
    decision: formData.get('decision'),
    evidenceMethod: formData.get('evidenceMethod'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) redirect(resultUrl('Check the review decision and reason.'))

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/auth/sign-in?next=/dashboard/verification')

  const { data, error } = await supabase.rpc('review_membership_verification_request', {
    p_request_id: parsed.data.requestId,
    p_decision: parsed.data.decision,
    p_evidence_method: parsed.data.evidenceMethod,
    p_reason: parsed.data.reason,
  })
  if (error || !data) {
    redirect(resultUrl(
      error?.code === '42501'
        ? 'You do not have permission to review this request.'
        : 'This request could not be reviewed. Refresh and try again.',
    ))
  }

  revalidatePath('/dashboard/verification')
  revalidatePath('/dashboard')
  redirect(resultUrl(`Membership ${parsed.data.decision}.`))
}

/**
 * Starts verifying a campus membership by moving the sign-in email to the
 * student's college address.
 *
 * Supabase sends its own email-change confirmation; once the new address is
 * confirmed, a database trigger marks the membership verified when the
 * address is on the university's domain. Nothing here marks anyone verified:
 * the domain check below only saves a student a confirmation email that could
 * never verify them.
 */
export async function startCollegeEmailVerificationAction(formData: FormData) {
  const parsed = collegeEmailSchema.safeParse(formData.get('collegeEmail'))
  if (!parsed.success) redirect(resultUrl('Enter your full college email address.'))

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/auth/sign-in?next=/dashboard/verification')

  const { data: membership } = await supabase
    .from('university_memberships')
    .select('status, university_id')
    .eq('user_id', claimsData.claims.sub)
    .maybeSingle()
  if (!membership) redirect('/onboarding')
  if (membership.status === 'verified') {
    redirect(resultUrl('Your campus access is already verified.'))
  }

  const { data: domainRows } = await supabase
    .from('university_email_domains')
    .select('domain')
    .eq('university_id', membership.university_id)
  const domains = (domainRows ?? []).map((row) => row.domain)
  if (!isEmailOnDomains(parsed.data, domains)) {
    redirect(
      resultUrl(
        domains.length
          ? `Use an address ending in @${domains[0]} to verify this campus.`
          : 'Your university does not have a verified email domain yet. Request a review instead.',
      ),
    )
  }

  const { error } = await supabase.auth.updateUser(
    { email: parsed.data },
    {
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/dashboard/verification`,
    },
  )
  if (error) {
    const message = /already|exists|registered/i.test(error.message)
      ? 'That college email already belongs to another ClassVault account. Sign in with it instead.'
      : /rate|security purposes|seconds/i.test(error.message)
        ? 'Please wait a minute before asking for another link.'
        : 'We could not send the confirmation link. Please try again.'
    redirect(resultUrl(message))
  }

  redirect(
    resultUrl(
      `Check ${parsed.data} for a confirmation link. If you signed up with another email address, confirm the link sent there too.`,
    ),
  )
}
