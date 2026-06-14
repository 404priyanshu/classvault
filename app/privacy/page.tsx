import type { Metadata } from "next";
import { LegalHeading, LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — ClassVault",
  description: "How ClassVault collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="14 June 2026">
      <p>
        ClassVault is a shared study-resource library for students. This policy explains what we
        collect, why, and the choices you have. We collect the minimum needed to run the service.
      </p>

      <LegalHeading>Information we collect</LegalHeading>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Account details.</strong> When you sign in with Google or an email one-time code,
          we store your name and email address. We do not receive or store your Google password, and
          we do not retain Google access or refresh tokens.
        </li>
        <li>
          <strong>Profile data.</strong> Optional department and semester you add to your profile.
        </li>
        <li>
          <strong>Content you upload.</strong> Files and their metadata (title, subject, course code,
          tags, description).
        </li>
        <li>
          <strong>Activity.</strong> Saves, ratings, downloads, and reports you make, used to power
          counts, trending, and moderation. Download events may include a coarse, hashed signal for
          abuse detection.
        </li>
      </ul>

      <LegalHeading>How we use it</LegalHeading>
      <p>
        To authenticate you, show and rank resources, attribute uploads, run the moderation queue,
        enforce rate limits, and keep the service secure. We do not sell your data or use it for
        advertising.
      </p>

      <LegalHeading>Where it lives</LegalHeading>
      <p>
        Account and activity data are stored in a managed PostgreSQL database. Uploaded files are
        stored in object storage and served through short-lived signed links. Reasonable technical
        measures protect this data; no system is perfectly secure.
      </p>

      <LegalHeading>Sharing</LegalHeading>
      <p>
        Published resources and your display name are visible to other signed-in members of your
        campus space. We share data with infrastructure providers (database, object storage, email
        delivery) solely to operate ClassVault, and when required by law.
      </p>

      <LegalHeading>Your choices</LegalHeading>
      <p>
        You can edit your profile, remove resources you own, and request deletion of your account and
        associated data by contacting us. Deleting your account removes your profile and unpublishes
        your uploads.
      </p>

      <LegalHeading>Contact</LegalHeading>
      <p>
        Questions or deletion requests: reach the ClassVault administrators at the contact address
        published for your campus deployment.
      </p>
    </LegalShell>
  );
}
