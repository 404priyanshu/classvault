# Campus membership review

Students without a confirmed email from the selected university stay `pending` after onboarding. They may use public features. They can submit their enrolment ID and optional context at `/dashboard/verification`; that information is a claim and does not grant campus access.

A reviewer must verify the claim independently against a trusted current university roster or through a known campus staff contact. The reviewer records which method was used and a reason visible to the student. A student ID supplied in the form, a display name, or an account email outside the university domain is not sufficient proof on its own. Do not ask students to enter passwords, OTPs, or ID card images in this form. The review queue is restricted to verified campus moderators/admins for that university and platform moderators/admins. Reviewers cannot decide their own requests.

The database function makes the decision and the `university_memberships` status change in one transaction. Approved requests set `verified_at`; rejected requests leave campus access closed. A rejected student may submit a new request with corrected details. Decided requests retain the reviewer ID, evidence method, reason, and time as an audit trail. The applicant sees only their own status and the reason, never the review queue or evidence method.

At least one trusted reviewer needs an existing `platform_moderator`/`platform_admin` assignment or a verified membership with the `moderator`/`admin` role at Bennett. These roles are server-owned; the request form does not grant them. An operator must assign the first reviewer through a separately reviewed administrative change before students are invited to submit claims.

Migration `20260922000000_create_membership_review.sql` adds the private request table and RPCs. Its direct table grants are revoked, forced RLS is enabled, and RPCs check actor and campus scope. It also closes a direct-call path that let an already onboarded student rerun onboarding and reset a reviewed membership. The pgTAP suite is `supabase/tests/membership_review.sql`.

The same hosted Supabase project serves development and production. Apply the migration only as a reviewed production change; deploying the new page first will make its RPC calls fail. A dedicated local Postgres stack or disposable Supabase project is needed to run the new pgTAP suite before applying it to production. Existing CI uses synthetic credentials and cannot run hosted database tests.
