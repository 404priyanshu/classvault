import type { Metadata } from 'next'
import Link from 'next/link'
import { legalContact } from '../contact'
import { PlaceholderNotice } from '../PlaceholderNotice'

export const metadata: Metadata = {
  title: 'Terms of Use — ClassVault',
  description:
    'The rules for using ClassVault: accounts, university verification, what you may upload, how moderation works, and how to contact us.',
}

export default function TermsPage() {
  return (
    <article className="legal-prose">
      <span className="stamp bg-[#f6f1e5] text-[#171512]">Legal</span>
      <h1 className="font-display mt-5 text-4xl font-black tracking-tight text-[#171512] md:text-5xl">
        Terms of Use
      </h1>
      <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-[#171512]/45">
        Last updated {legalContact.lastUpdated}
      </p>

      <div className="mt-10">
        <PlaceholderNotice />
      </div>

      <p className="lead">
        ClassVault is a study platform for college students in India. These terms
        explain what you can expect from us and what we expect from you. They are
        a binding agreement, so please read them.
      </p>

      <h2>1. Who operates ClassVault</h2>
      <p>
        ClassVault is operated by {legalContact.operatorName} (&ldquo;ClassVault&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;). You can reach us at{' '}
        <a href={`mailto:${legalContact.generalEmail}`}>
          {legalContact.generalEmail}
        </a>
        .
      </p>
      <p>
        We are an intermediary. We host material that students upload; we do not
        create it and we do not check it before it appears. Section 7 explains
        what we do when something is wrong.
      </p>

      <h2>2. Early access</h2>
      <p>
        ClassVault is early software, open at a limited number of campuses. Things
        will break, features will change, and we may stop offering any part of the
        service. Do not treat ClassVault as the only copy of anything you care
        about. Keep your own backups of your notes.
      </p>

      <h2>3. Who may use ClassVault</h2>
      <p>
        You must be at least 18 years old and enrolled at, or affiliated with, a
        college or university. If you are under 18, you may not create an account.
      </p>
      <p>
        You are responsible for what happens under your account, including keeping
        your password private. Tell us promptly if you think someone else has
        access to it.
      </p>

      <h2>4. University verification</h2>
      <p>
        Some parts of ClassVault are scoped to a single university. You get a{' '}
        <strong>verified</strong> membership only when the university you select
        matches the domain of an academic email address you have confirmed.
        Everything else stays <strong>pending</strong>.
      </p>
      <p>
        Verification tells us which campus you belong to. It is not proof of
        identity, enrolment status, or academic standing, and we do not present it
        as such. If you lose access to a university — because your membership
        changes or we withdraw it — you immediately lose access to that
        university&rsquo;s scoped material.
      </p>
      <p>
        Phone numbers get recycled. Having a phone number is not proof that you
        are a particular person, and we do not treat it that way.
      </p>

      <h2>5. What you upload</h2>
      <p>
        You keep ownership of everything you upload. You give us a non-exclusive,
        royalty-free licence to store, reproduce, and display it for the purpose
        of operating ClassVault — showing it to the students you chose to share it
        with, extracting text so it can be searched, generating study material for
        you from it, and keeping backups. This licence lasts as long as we host
        the material and ends when it is fully removed under section 6.
      </p>
      <p>
        <strong>By uploading, you confirm all of the following.</strong>
      </p>
      <ul>
        <li>The material is yours, or you have permission to share it.</li>
        <li>
          Sharing it does not infringe anyone&rsquo;s copyright and does not break
          your institution&rsquo;s rules.
        </li>
        <li>
          It contains no exam material you are not permitted to circulate, no
          personal information about other people, and nothing unlawful.
        </li>
      </ul>
      <p>
        Publishing a scan of a textbook, a purchased question bank, a
        publisher&rsquo;s solution manual, or a professor&rsquo;s slide deck that
        you do not have permission to redistribute is not allowed, even though it
        is common practice in student groups. This is the rule we enforce most
        often. If you are not sure whether you may share something, do not upload
        it.
      </p>
      <p>
        You choose the audience when you upload, and that choice is fixed
        afterwards. Uploaded files cannot be edited or swapped — to change a file,
        delete the note and upload a new one.
      </p>

      <h2>6. Deleting your material</h2>
      <p>
        You can delete any note you uploaded. Deleted notes move to Trash, where
        you can restore them for <strong>30 days</strong>. After that, we
        permanently remove the file and its metadata, and it cannot be recovered.
      </p>
      <p>
        Ratings that other students left on a note are anonymous aggregate signals
        about that material and may be retained after you lose access to it. Study
        rooms and their chat are temporary by design: they are destroyed when the
        room ends, when the last member leaves, or when the room expires.
      </p>

      <h2>7. What you find on ClassVault</h2>
      <p>
        Notes on ClassVault are written by students. We do not verify that they
        are accurate, complete, current, or suitable for your syllabus or your
        exam. Ratings reflect the opinions of other students and nothing more.
      </p>
      <p>
        <strong>Use your own judgement.</strong> Do not rely on anything here as
        your only source, and do not use ClassVault in any way that breaks your
        institution&rsquo;s academic integrity rules. Submitting someone
        else&rsquo;s notes as your own work is your responsibility, not ours.
      </p>

      <h2>8. Rules of use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>upload anything that breaks section 5;</li>
        <li>harass, threaten, impersonate, or spam other students;</li>
        <li>
          scrape, bulk-download, or redistribute material from ClassVault outside
          the platform;
        </li>
        <li>
          try to reach material you have not been given access to, or interfere
          with our access controls, rate limits, or infrastructure;
        </li>
        <li>
          upload malware, or files disguised as something other than what they
          are;
        </li>
        <li>use ClassVault to break any applicable law.</li>
      </ul>

      <h2>9. Reporting and moderation</h2>
      <p>
        Any student who can see a note can report it. Reports are private — the
        person who uploaded the note is not told who reported it.
      </p>
      <p>
        Moderators can restrict, remove, restore, or hold a note. Every moderation
        action is recorded. If we act on something you uploaded, you will see a
        notice in your vault explaining what happened, without the reporter&rsquo;s
        identity.
      </p>
      <p>
        We may suspend or close an account that repeatedly breaks these terms. For
        copyright complaints specifically, follow the process on our{' '}
        <Link href="/legal/takedown">content report and takedown page</Link>.
      </p>

      <h2>10. Paid plans</h2>
      <p>
        ClassVault is currently free. Pricing shown on our site describes plans we
        intend to offer; no payment method is connected and we cannot charge you
        today. If we introduce paid plans, we will publish the terms and you will
        have to agree to them separately before paying anything.
      </p>

      <h2>11. Suspension and closure</h2>
      <p>
        You can stop using ClassVault at any time. We may suspend or close your
        account if you break these terms, if we are required to by law, or if we
        stop operating the service. Where it is reasonable to do so, we will tell
        you first and give you a chance to retrieve your uploads.
      </p>

      <h2>12. Liability</h2>
      <p>
        ClassVault is provided &ldquo;as is&rdquo;. To the fullest extent the law
        allows, we are not liable for lost data, missed deadlines, exam outcomes,
        or any indirect or consequential loss arising from your use of the
        service. Nothing here limits liability that cannot lawfully be limited.
      </p>

      <h2>13. Grievances</h2>
      <p>
        If you have a complaint about ClassVault or about material on it, write to
        our grievance officer, {legalContact.grievanceOfficerName}, at{' '}
        <a href={`mailto:${legalContact.grievanceEmail}`}>
          {legalContact.grievanceEmail}
        </a>
        , or by post at {legalContact.operatorAddress}. We aim to acknowledge
        complaints within 24 hours and resolve them within 15 days.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These terms are governed by the laws of India, and the courts at{' '}
        {legalContact.jurisdiction} have exclusive jurisdiction over any dispute.
      </p>

      <h2>15. Changes</h2>
      <p>
        We may update these terms. If a change materially affects you, we will
        give you notice through the service before it takes effect. Continuing to
        use ClassVault after that means you accept the updated terms.
      </p>
    </article>
  )
}
