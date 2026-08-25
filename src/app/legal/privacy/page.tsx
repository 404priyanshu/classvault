import type { Metadata } from 'next'
import Link from 'next/link'
import { legalContact } from '../contact'
import { PlaceholderNotice } from '../PlaceholderNotice'

export const metadata: Metadata = {
  title: 'Privacy Policy — ClassVault',
  description:
    'What personal data ClassVault collects, why, who processes it, how long it is kept, and the rights you have over it.',
}

export default function PrivacyPage() {
  return (
    <article className="legal-prose">
      <span className="stamp bg-[#f6f1e5] text-[#171512]">Legal</span>
      <h1 className="font-display mt-5 text-4xl font-black tracking-tight text-[#171512] md:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-[#171512]/45">
        Last updated {legalContact.lastUpdated}
      </p>

      <div className="mt-10">
        <PlaceholderNotice />
      </div>

      <p className="lead">
        This explains what ClassVault collects about you, why, who else touches
        it, how long we keep it, and what you can ask us to do with it. It covers
        the ClassVault website and application operated by{' '}
        {legalContact.operatorName}.
      </p>

      <h2>1. What we collect</h2>
      <p>
        <strong>When you create an account.</strong> Your email address, or your
        phone number if you sign in by SMS, or your name and email from Google or
        GitHub if you use those. Passwords are stored only as a hash by our
        authentication provider — we never see or hold your password.
      </p>
      <p>
        <strong>When you complete onboarding.</strong> Your display name, your
        university, your degree, your expected graduation year, and your study
        preferences. If you verify with an academic email address, we store that
        address and the university it belongs to.
      </p>
      <p>
        <strong>When you upload a note.</strong> The file itself, its title,
        description, subject, tags, file type and size, and a SHA-256 checksum of
        the contents. For PDFs we also extract the text so the note can be
        searched. Files are stored privately; they are never public objects.
      </p>
      <p>
        <strong>When you use the product.</strong> Ratings you leave on notes,
        reports you file, rooms you join and messages you send in them, study
        roadmaps generated for you, and your progress through their tasks. If you
        upload a profile photo it is stored in a public bucket, so treat it as
        publicly visible.
      </p>
      <p>
        <strong>Automatically.</strong> Standard server logs from our host,
        including IP address and request metadata, and a bot-detection signal from
        Cloudflare Turnstile on sign-up, password reset, and phone sign-in.
      </p>
      <p>
        <strong>We do not</strong> run per-user behavioural analytics, advertising
        trackers, or third-party analytics scripts. Operational metrics we look at
        are aggregate counts only.
      </p>

      <h2>2. Why we use it</h2>
      <ul>
        <li>To run your account and keep you signed in.</li>
        <li>
          To decide what you are allowed to see. University scoping and note
          access are enforced from your verified membership.
        </li>
        <li>
          To make notes findable, including by text extracted from PDFs you
          uploaded.
        </li>
        <li>To generate study roadmaps from notes you are entitled to use.</li>
        <li>
          To keep the platform safe — handling reports, moderating content, and
          limiting abuse and automated sign-ups.
        </li>
        <li>To respond when you contact us.</li>
      </ul>
      <p>
        We process this data to provide a service you asked for, to meet legal
        obligations that apply to us as an intermediary, and — for safety and
        abuse prevention — because we have a legitimate interest in the platform
        not being harmful to the students using it.
      </p>

      <h2>3. What other students can see</h2>
      <p>
        Your display name, profile photo, degree, and graduation year are visible
        to other students. Contributor information on a note is shown
        pseudonymously.
      </p>
      <p>
        Ratings are anonymous and shown only as aggregates. If you report a note,
        the person who uploaded it is never told who reported it. Study-room
        membership and chat are visible to others in that room while it exists.
      </p>
      <p>
        Your email address, phone number, and password are never shown to other
        students.
      </p>

      <h2>4. Who else processes your data</h2>
      <p>
        We do not sell your data and we do not share it for advertising. We rely
        on these providers to operate:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication, database, file storage, and
          realtime updates.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and server logs.
        </li>
        <li>
          <strong>Cloudflare</strong> — Turnstile bot detection on authentication
          forms.
        </li>
        <li>
          <strong>Twilio</strong> — delivery of SMS one-time codes, if you sign in
          by phone.
        </li>
        <li>
          <strong>Google and GitHub</strong> — only if you choose to sign in with
          them.
        </li>
      </ul>
      <p>
        These providers operate outside India, so your data is transferred and
        stored abroad. We may also disclose data where the law requires it, or to
        respond to a valid legal request.
      </p>

      <h2>5. How long we keep it</h2>
      <ul>
        <li>
          <strong>Account and profile data</strong> — while your account exists.
        </li>
        <li>
          <strong>Deleted notes</strong> — recoverable by you for 30 days, then
          the file, its record, its ratings, and any derived roadmap data are
          permanently removed.
        </li>
        <li>
          <strong>Study rooms and their chat</strong> — destroyed when the room
          ends, when the last member leaves, or when it expires. They are not
          archived.
        </li>
        <li>
          <strong>Ratings</strong> — kept even after you lose access to the note
          they were left on, because they were valid when made and removing them
          would distort that note&rsquo;s history.
        </li>
        <li>
          <strong>Moderation records</strong> — kept as an audit trail of actions
          taken.
        </li>
      </ul>

      <h2>6. If you delete your account</h2>
      <p>
        We remove your account and profile data. <strong>We do not delete the
        notes, ratings, or shared roadmaps you contributed</strong> — they stay
        available under their existing scope so that other students&rsquo;
        libraries and shared links do not break. Those contributions are no longer
        connected to a live profile.
      </p>
      <p>
        If you want a specific note removed rather than kept, delete it yourself
        before closing your account, or ask us and we will remove it.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Under the Digital Personal Data Protection Act, 2023, you can ask us to:
      </p>
      <ul>
        <li>tell you what personal data of yours we hold and who we shared it with;</li>
        <li>correct or complete anything inaccurate;</li>
        <li>erase data we no longer need, subject to section 6 and our legal obligations;</li>
        <li>nominate someone to exercise these rights if you die or become incapacitated.</li>
      </ul>
      <p>
        Much of this you can do yourself: edit your identity and study preferences
        at <strong>Settings</strong>, and manage or delete your uploads in{' '}
        <strong>My Vault</strong>. For anything else, write to us using section 9.
      </p>
      <p>
        You may withdraw consent at any time by closing your account. That does
        not undo processing we already carried out lawfully.
      </p>

      <h2>8. Security and children</h2>
      <p>
        Access to notes is enforced in the database itself, not just hidden in the
        interface. Uploaded files are stored privately and served through
        short-lived signed links. Passwords are hashed by our authentication
        provider. No system is perfectly secure, so please use a password you do
        not reuse elsewhere.
      </p>
      <p>
        ClassVault is for students aged 18 and over. We do not knowingly collect
        data from children. If you believe a child has created an account, tell us
        and we will remove it.
      </p>

      <h2>9. Contact and complaints</h2>
      <p>
        For any privacy question or request, write to {legalContact.grievanceOfficerName}{' '}
        at{' '}
        <a href={`mailto:${legalContact.grievanceEmail}`}>
          {legalContact.grievanceEmail}
        </a>
        , or by post at {legalContact.operatorAddress}. We aim to acknowledge
        within 24 hours and resolve within 15 days.
      </p>
      <p>
        If you are not satisfied with our response, you may complain to the Data
        Protection Board of India.
      </p>

      <h2>10. Changes</h2>
      <p>
        If we change how we use your data in a way that materially affects you, we
        will give you notice through the service before it takes effect.
      </p>
      <p>
        See also our <Link href="/legal/terms">Terms of Use</Link> and our{' '}
        <Link href="/legal/takedown">content report and takedown process</Link>.
      </p>
    </article>
  )
}
