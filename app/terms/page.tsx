import type { Metadata } from "next";
import { LegalHeading, LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Use — ClassVault",
  description: "The rules for using ClassVault.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Use" updated="14 June 2026">
      <p>
        By using ClassVault you agree to these terms. ClassVault is provided to help students share
        study material within their campus community.
      </p>

      <LegalHeading>Accounts</LegalHeading>
      <p>
        Sign in with an eligible account. Keep your access secure; you are responsible for activity
        under your account. We may suspend accounts that violate these terms.
      </p>

      <LegalHeading>Content you upload</LegalHeading>
      <ul className="list-disc space-y-2 pl-5">
        <li>Only upload material you have the right to share.</li>
        <li>
          Do not upload copyrighted exam papers or solutions where prohibited, malware, or content
          that is unlawful, harassing, or violates academic-integrity rules.
        </li>
        <li>
          Uploads enter a moderation queue and are published only after review. Moderators may reject,
          hide, or remove content that breaks these rules.
        </li>
        <li>
          You keep ownership of what you upload and grant ClassVault permission to store and display
          it to other members so the library can function.
        </li>
      </ul>

      <LegalHeading>Acceptable use</LegalHeading>
      <p>
        Do not abuse the service: no scraping, no circumventing rate limits, no attempts to access
        other users&rsquo; data, and no uploading of malicious files. Report resources that break the
        rules using the in-app report action.
      </p>

      <LegalHeading>Availability and disclaimer</LegalHeading>
      <p>
        ClassVault is provided &ldquo;as is&rdquo; without warranties. We do not guarantee the
        accuracy of user-contributed material or uninterrupted availability, and we are not liable for
        academic outcomes arising from use of the resources.
      </p>

      <LegalHeading>Changes</LegalHeading>
      <p>
        We may update these terms as the service evolves. Continued use after an update means you
        accept the revised terms.
      </p>
    </LegalShell>
  );
}
