import type { Metadata } from 'next'
import Link from 'next/link'
import { legalContact } from '../contact'
import { PlaceholderNotice } from '../PlaceholderNotice'

export const metadata: Metadata = {
  title: 'Report content — ClassVault',
  description:
    'How to report copyright infringement or unlawful material on ClassVault, what a valid notice must contain, and how we respond.',
}

export default function TakedownPage() {
  return (
    <article className="legal-prose">
      <span className="stamp bg-[#f6f1e5] text-[#171512]">Trust</span>
      <h1 className="font-display mt-5 text-4xl font-black tracking-tight text-[#171512] md:text-5xl">
        Report content
      </h1>
      <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-[#171512]/45">
        Last updated {legalContact.lastUpdated}
      </p>

      <div className="mt-10">
        <PlaceholderNotice />
      </div>

      <p className="lead">
        Students upload the material on ClassVault. We do not review it before it
        appears. If something here infringes your copyright or is otherwise
        unlawful, tell us and we will act on it.
      </p>

      <h2>If you are a signed-in student</h2>
      <p>
        Use the <strong>Report</strong> control on the note itself. It is faster
        than email, it reaches the moderators for that campus directly, and your
        identity is never shown to the person who uploaded the note. Use this page
        instead if you cannot see the note, or if you are the rights holder rather
        than a student.
      </p>

      <h2>Sending a notice</h2>
      <p>
        Email{' '}
        <a href={`mailto:${legalContact.grievanceEmail}`}>
          {legalContact.grievanceEmail}
        </a>{' '}
        with the subject line <strong>Content notice</strong>, or write to us at{' '}
        {legalContact.operatorAddress}.
      </p>
      <p>So that we can act, your notice needs to contain:</p>
      <ol>
        <li>
          <strong>What to remove.</strong> The link to the note, or enough detail
          that we can identify exactly which material you mean. A description of a
          whole category of material is not enough.
        </li>
        <li>
          <strong>What is wrong with it.</strong> For copyright, identify the work
          you own and how the upload infringes it. For anything else, tell us
          which law or which of our rules it breaks.
        </li>
        <li>
          <strong>Who you are.</strong> Your name, postal address, email, and
          phone number.
        </li>
        <li>
          <strong>Your authority.</strong> Confirmation that you own the rights or
          are authorised to act for the owner.
        </li>
        <li>
          <strong>A statement of good faith</strong> that the use is not
          authorised by the rights holder or permitted by law, and that the
          information in your notice is accurate.
        </li>
      </ol>
      <p>
        An incomplete notice slows things down — we will come back to you for the
        missing parts rather than acting on a notice we cannot verify.
      </p>

      <h2>What happens next</h2>
      <ul>
        <li>
          <strong>Within 24 hours</strong> we acknowledge that we received your
          notice.
        </li>
        <li>
          We review it. Where the claim is clear, we restrict access to the
          material while we work, so it stops circulating during the review.
        </li>
        <li>
          <strong>Within 15 days</strong> we resolve the complaint and tell you
          the outcome.
        </li>
        <li>
          We tell the student what was removed and why, without identifying you.
          Every action is recorded in our moderation log.
        </li>
      </ul>

      <h2>If we removed your note</h2>
      <p>
        If you believe your material was removed in error — for example, because
        you do have permission to share it, or the material is your own original
        work — reply to the notice you received, or write to{' '}
        <a href={`mailto:${legalContact.grievanceEmail}`}>
          {legalContact.grievanceEmail}
        </a>{' '}
        explaining why. Include your account email and the note title. We will
        review it and restore the note if the complaint does not hold up.
      </p>

      <h2>Repeated infringement</h2>
      <p>
        Accounts that repeatedly upload infringing material are suspended. This is
        not a warning system we apply reluctantly — redistributing textbooks,
        question banks, solution manuals, and lecture slides without permission is
        the most common way a platform like this becomes a liability to the
        students using it, and we would rather lose the upload than the platform.
      </p>

      <h2>False notices</h2>
      <p>
        Sending a notice you know to be false wastes moderation time that belongs
        to students with real complaints, and can carry legal consequences for
        you. We keep records of notices received.
      </p>

      <h2>Grievance officer</h2>
      <p>
        In line with the Information Technology (Intermediary Guidelines and
        Digital Media Ethics Code) Rules, 2021, our grievance officer is:
      </p>
      <div className="paper-card my-6 rounded-2xl p-6">
        <p className="m-0 font-bold text-[#171512]">
          {legalContact.grievanceOfficerName}
        </p>
        <p className="m-0 mt-2 text-sm">
          <a href={`mailto:${legalContact.grievanceEmail}`}>
            {legalContact.grievanceEmail}
          </a>
        </p>
        <p className="m-0 mt-1 text-sm">{legalContact.operatorAddress}</p>
      </div>
      <p>
        The <Link href="/legal/terms">Terms of Use</Link> explain what may be
        uploaded and how moderation decisions are made.
      </p>
    </article>
  )
}
