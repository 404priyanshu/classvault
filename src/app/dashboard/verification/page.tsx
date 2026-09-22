import { redirect } from 'next/navigation'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { getRequestClaims } from '@/lib/supabase/claims'
import { createClient } from '@/lib/supabase/server'
import {
  reviewMembershipVerificationAction,
  submitMembershipVerificationAction,
} from './actions'

export const dynamic = 'force-dynamic'

type VerificationPageProps = {
  searchParams: Promise<{ status?: string }>
}

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
})

export default async function VerificationPage({ searchParams }: VerificationPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const claims = await getRequestClaims()
  if (!claims) redirect('/auth/sign-in?next=/dashboard/verification')

  const [membershipResult, ownResult, queueResult, roleResult] = await Promise.all([
    supabase.from('university_memberships')
      .select('status, role, university_id, universities(name)')
      .eq('user_id', claims.sub).maybeSingle(),
    supabase.rpc('list_own_membership_verification_requests'),
    supabase.rpc('list_membership_verification_queue', { p_limit: 100 }),
    supabase.rpc('has_platform_notes_role', {
      accepted_roles: ['platform_moderator', 'platform_admin'],
    }),
  ])

  if (membershipResult.error || ownResult.error || queueResult.error || roleResult.error) {
    throw new Error('Campus verification could not be loaded.')
  }

  const membership = membershipResult.data
  const requests = ownResult.data || []
  const queue = queueResult.data || []
  const latest = requests[0]
  const isReviewer = Boolean(roleResult.data) ||
    (membership?.status === 'verified' &&
      ['moderator', 'admin'].includes(membership.role))
  const canApply = Boolean(membership) && membership?.status !== 'verified' && latest?.status !== 'pending'

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <AuthMessage status={params.status} />
      <PageHeader
        title="Campus verification"
        description="Request campus access or review enrolment claims for your university."
      />

      <section className="rounded-3xl border border-club-line bg-club-paper p-6 [box-shadow:var(--elev-inline)]">
        <h2 className="text-xl font-black">Your campus access</h2>
        <p className="mt-2 text-sm text-club-muted">
          {membership?.universities?.name || 'Your university'} ·{' '}
          <strong className="capitalize text-club-purple">{membership?.status || 'pending'}</strong>
        </p>
        {membership?.status === 'verified' ? (
          <p className="mt-4 text-sm">Your campus-only notes and rooms are available.</p>
        ) : latest?.status === 'pending' ? (
          <p className="mt-4 text-sm">Your request from {dateFormat.format(new Date(latest.submitted_at))} is waiting for a campus reviewer. Public features remain available.</p>
        ) : (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-club-muted">
            Submit your enrolment ID and a short explanation. A reviewer must independently check a trusted university roster or confirm with campus staff before approving access. Do not enter passwords, OTPs, or ID card images.
          </p>
        )}

        {latest?.status === 'rejected' && latest.decision_reason ? (
          <p className="mt-4 rounded-xl bg-club-lavender p-4 text-sm">Previous decision: {latest.decision_reason}</p>
        ) : null}

        {canApply ? (
          <form action={submitMembershipVerificationAction} className="mt-6 grid max-w-2xl gap-4">
            <label className="grid gap-1 text-sm font-bold">
              Enrolment ID
              <input className="min-h-11 rounded-xl border border-club-line bg-club-bg px-4 font-normal" name="enrolmentId" minLength={4} maxLength={60} required autoComplete="off" />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Details that help us check your enrolment (optional)
              <textarea className="min-h-28 rounded-xl border border-club-line bg-club-bg p-4 font-normal" name="context" maxLength={1000} />
            </label>
            <button className="min-h-11 justify-self-start rounded-full bg-club-purple px-6 text-sm font-black text-club-paper" type="submit">Request review</button>
          </form>
        ) : null}
      </section>

      {isReviewer ? (
        <section className="space-y-4" aria-labelledby="review-queue-title">
          <div>
            <h2 className="text-xl font-black" id="review-queue-title">Review queue</h2>
            <p className="mt-1 text-sm text-club-muted">Claims are private. Approve only after an independent roster check or confirmation from campus staff.</p>
          </div>
          {queue.length === 0 ? (
            <p className="rounded-3xl border border-club-line bg-club-paper p-6 text-sm text-club-muted">No pending requests in your scope.</p>
          ) : queue.map((item) => (
            <article className="space-y-4 rounded-3xl border border-club-line bg-club-paper p-6" key={item.request_id}>
              <div>
                <h3 className="text-lg font-black">{item.display_name}</h3>
                <p className="text-sm text-club-muted">{item.university_name} · {item.course || 'Course not set'} · {item.graduation_year || 'Year not set'}</p>
                <p className="mt-2 break-all text-sm">Account email: {item.account_email || 'Phone-only account'}</p>
                <p className="text-sm">Enrolment ID: <strong>{item.enrolment_id}</strong></p>
                {item.student_context ? <p className="mt-2 rounded-xl bg-club-lavender p-3 text-sm">{item.student_context}</p> : null}
                <p className="mt-2 text-xs text-club-muted">Submitted {dateFormat.format(new Date(item.submitted_at))}. Profile details are student supplied; verify independently.</p>
              </div>
              <div className="grid gap-4 border-t border-club-line pt-4 lg:grid-cols-2">
                <form action={reviewMembershipVerificationAction} className="grid gap-3">
                  <input name="requestId" type="hidden" value={item.request_id} />
                  <input name="decision" type="hidden" value="approved" />
                  <label className="grid gap-1 text-sm font-bold">How enrolment was checked
                    <select className="min-h-11 rounded-xl border border-club-line bg-club-bg px-3 font-normal" name="evidenceMethod" required>
                      <option value="roster_check">Trusted university roster</option>
                      <option value="campus_staff_confirmation">Campus staff confirmation</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-bold">Reason shown to student
                    <textarea className="min-h-24 rounded-xl border border-club-line bg-club-bg p-3 font-normal" name="reason" minLength={10} maxLength={500} required />
                  </label>
                  <button className="min-h-11 rounded-full bg-club-purple px-5 text-sm font-black text-club-paper" type="submit">Approve membership</button>
                </form>
                <form action={reviewMembershipVerificationAction} className="grid gap-3">
                  <input name="requestId" type="hidden" value={item.request_id} />
                  <input name="decision" type="hidden" value="rejected" />
                  <input name="evidenceMethod" type="hidden" value="insufficient_evidence" />
                  <label className="grid gap-1 text-sm font-bold">Reason shown to student
                    <textarea className="min-h-24 rounded-xl border border-club-line bg-club-bg p-3 font-normal" name="reason" minLength={10} maxLength={500} required />
                  </label>
                  <button className="min-h-11 rounded-full border border-club-purple px-5 text-sm font-black text-club-purple" type="submit">Reject request</button>
                </form>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
