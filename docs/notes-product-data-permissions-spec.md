# ClassVault Notes — Product, Data, and Permissions Specification

```yaml
status: Implementation baseline
version: 3
date: 2026-08-24
scope: Notes upload, discovery, download, rating, deletion, recovery, moderation, search, and roadmap-authorization boundaries
implementation_status: Upload, browse/detail/download, ratings/ranking, Trash recovery, report/moderation, permission-safe metadata/PDF full-text search, and the static roadmap authorization foundation are implemented; OCR, external search, and AI roadmap generation remain deferred
```

The foundation, upload pipeline, library access, rating/ranking, lifecycle, and
moderation, search, and roadmap-foundation migrations are versioned in
`supabase/migrations`. The protected routes now include upload,
library/detail/download, My Vault, the scoped `/dashboard/moderation` queue,
and `/dashboard/roadmaps`. The search and roadmap migrations are ready to push
to the linked hosted project; local typecheck, lint, production build, unit
tests, and the rollback-only hosted roadmap pgTAP run pass.

## 1. Purpose

This document converts the landing-page notes promises into an implementable
contract. It defines what the first real notes module does, which data it owns,
and how every access decision is enforced.

The module must preserve these ClassVault principles:

- Notes are either available to all eligible ClassVault students or restricted
  to one verified university community.
- A client-supplied university, role, verification claim, or storage path is
  never trusted.
- Note files are private objects. Access is granted only after the server and
  database confirm that the requester may read the note.
- Public profile identity is pseudonymous. Account emails and phone numbers are
  never exposed with uploaded notes, ratings, reports, or search results.
- A deleted note is recoverable for 30 days with its ratings intact.
- Search, downloads, roadmap source authorization, and moderation all reuse the same note
  authorization decision.

## 2. MVP boundary

### Included

- Create a note draft.
- Upload one PDF or raster image per note.
- Add a title, subject, note type, optional description, and optional tags.
- Publish as `public` or `university`.
- Browse notes the current student may access.
- View note metadata and a safe preview.
- Download through a short-lived authorized URL.
- Create or update one 1–5 star rating per eligible student.
- Rank notes using rating volume and rating recency.
- Soft-delete, restore, and permanently purge after 30 days.
- Report a note and provide server-owned moderation boundaries.
- Extract text for later permission-aware full-text search.

### Not included in the first notes release

- Anonymous internet browsing or downloading.
- Multiple files or folders in one note.
- Collaborative editing or shared ownership.
- Comments, followers, direct messaging, or profile discovery.
- Paid access to university notes.
- AI-generated summaries or roadmaps.
- An external search, OCR, antivirus, or object-storage provider commitment.
- Copyright adjudication, legal-hold policy, or a complete moderator console.

## 3. Product vocabulary and decisions

### Eligibility

An **eligible student** is authenticated and has completed onboarding. The note
module does not use unvalidated cookie session data for authorization; server
code uses validated Supabase claims through `getClaims()` or `getUser()`.

### Visibility

`public` means visible to eligible signed-in ClassVault students. It does not
mean anonymously available on the internet.

`university` means visible only to students whose current
`university_memberships` row is `verified` for the note's immutable
`university_id`.

Pending, rejected, phone-only, or otherwise unverified students may use public
notes but cannot browse, publish, rate, search, or download university notes.

### Ownership

The authenticated creator is the note owner. Ownership is server-derived from
`auth.uid()` and cannot be transferred in the MVP.

Once a university note is published, its `university_id` is immutable. If its
owner later changes university or loses verification, the note remains in its
original university archive. The owner retains owner-management access, while
ordinary readership continues to require a verified membership in the original
university.

### Published-file immutability

A published note's source file cannot be silently replaced. Ratings must always
refer to the file students actually reviewed. A correction is uploaded as a new
note and may mark the old note as superseded.

Metadata may be edited through a server-owned operation. Any edit that changes
scope, subject, or safety-sensitive metadata must re-run publication checks.

## 4. User journeys

### Upload and publish

1. An eligible student creates a draft.
2. The server derives `owner_id`, creates an opaque object key, and returns an
   expiring upload grant.
3. The client uploads one allowed file directly to the private storage backend.
4. A server-owned finalize operation verifies object ownership, detected MIME
   type, size, checksum, and processing status.
5. The student supplies required metadata and chooses `public` or `university`.
6. Publication derives university scope from the current verified membership.
   The client never supplies an authoritative university ID.
7. The note becomes discoverable only when the file is ready, publication
   checks pass, it is not deleted, and moderation allows access.

### Browse, preview, and download

1. The browse query applies database authorization before sorting or paging.
2. The feed returns safe metadata and aggregate ratings, never storage object
   keys, account emails, phone numbers, or report details.
3. Opening or downloading a note rechecks permission using the note ID.
4. A successful request receives a short-lived signed URL. Possessing an old
   result-page URL or guessing an object path never bypasses authorization.

### Rate

1. A student can rate only a currently readable, published note.
2. Owners cannot rate their own notes.
3. Each student has one rating per note and may change it from 1 to 5.
4. Rating summaries are server-maintained. Clients cannot write averages,
   counts, or ranking scores.

### Delete and restore

1. The owner deletes a note through a server-owned operation.
2. The database sets `deleted_at` and `purge_after = deleted_at + 30 days`.
3. The note immediately disappears from feeds, search, ratings, roadmaps, and
   other students' downloads.
4. The owner sees the note in Trash and may restore it before `purge_after`.
5. Restoration clears deletion timestamps and preserves ratings.
6. An idempotent scheduled job permanently deletes metadata, ratings, extracted
   text, previews, and source objects after the deadline unless a server-owned
   moderation or legal retention hold applies.

## 5. Proposed relational model

Names below are the canonical migration target. Exact storage-provider fields
may be adapted without changing the product contract.

### `subjects`

Normalized subject choices used for metadata and search.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `bigint identity` | Primary key |
| `university_id` | `bigint null` | Null for global subjects; otherwise references `universities` |
| `course` | `text null` | Optional degree context using current supported course values |
| `code` | `text null` | Optional university course code |
| `name` | `text` | 2–120 characters |
| `slug` | `text` | Normalized identifier unique within its scope |
| `is_active` | `boolean` | Inactive values remain readable on existing notes |
| `created_at`, `updated_at` | `timestamptz` | Server timestamps |

Global subjects are readable by every eligible student. University subjects are
readable only by verified members of that university and authorized moderators.
The first release may seed a small global list and expand the curated directory
later.

### `notes`

Authoritative note metadata and lifecycle state.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Server-generated primary key |
| `owner_id` | `uuid` | Server-derived authenticated user; immutable |
| `subject_id` | `bigint` | Required before publication |
| `visibility` | `text` | `public` or `university` |
| `university_id` | `bigint null` | Required only for university visibility; server-derived and immutable after publication |
| `title` | `text` | Trimmed, 3–180 characters |
| `description` | `text null` | At most 2,000 characters |
| `note_type` | `text` | `lecture_notes`, `summary`, `pyq`, `solution`, `lab`, or `other` |
| `tags` | `text[]` | At most 10 normalized tags, each 2–32 characters |
| `publication_status` | `text` | `draft`, `processing`, `published`, or `failed` |
| `moderation_status` | `text` | `clear`, `under_review`, `restricted`, or `removed` |
| `published_at` | `timestamptz null` | Set only by publication operation |
| `deleted_at` | `timestamptz null` | Soft-deletion time |
| `purge_after` | `timestamptz null` | Exactly 30 days after deletion |
| `purge_claimed_at` | `timestamptz null` | Short-lived server-only claim while expired storage is being removed |
| `retention_hold` | `boolean` | Server/moderator-owned; default false |
| `superseded_by_note_id` | `uuid null` | Optional link to a corrected replacement |
| `created_at`, `updated_at` | `timestamptz` | Server timestamps |

Required checks:

- `visibility = 'public'` requires `university_id is null`.
- `visibility = 'university'` requires `university_id is not null`.
- `deleted_at` and `purge_after` are either both null or both present.
- `purge_after = deleted_at + interval '30 days'` is assigned by server code.
- `purge_claimed_at` is never client-writable and may be set only by the
  idempotent scheduled purge claim step.
- `published_at` is present only after a successful publication transition.
- A publication RPC verifies the related asset is ready; a client cannot make a
  note published with a direct column update.

### `note_assets`

Private storage metadata. Clients receive no general table access.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `note_id` | `uuid` | Unique FK to `notes`; one source asset per MVP note |
| `storage_backend` | `text` | Provider adapter name, not a user choice |
| `object_key` | `text` | Opaque unique key with no email, name, or campus data |
| `original_filename` | `text` | Sanitized display-only name; never used as an object key |
| `detected_mime_type` | `text` | Server-detected type |
| `byte_size` | `bigint` | Validated size |
| `sha256` | `text` | Exact-file duplicate and integrity signal |
| `processing_status` | `text` | `uploading`, `scanning`, `ready`, `rejected`, or `purged` |
| `page_count` | `integer null` | Derived when available |
| `preview_object_key` | `text null` | Private derived preview |
| `created_at`, `updated_at` | `timestamptz` | Server timestamps |

Initial file policy:

- Allowed: PDF, JPEG, PNG, and WebP.
- Rejected: SVG, HTML, executables, archives, and MIME/extension mismatches.
- Default maximum: 25 MiB per source file, configurable server-side.
- Validation uses detected file content, not only the browser-provided MIME type
  or filename extension.
- Object keys follow an opaque pattern such as
  `notes/{note_uuid}/source/{asset_uuid}`.

### `note_search_documents`

Derived and replaceable search data, separated from feed metadata.

| Column | Type | Rule |
| --- | --- | --- |
| `note_id` | `uuid` | Primary key and FK to `notes` |
| `extraction_status` | `text` | `pending`, `ready`, `failed`, or `unsupported` |
| `extracted_text` | `text null` | Untrusted derived text; never rendered as HTML |
| `search_document` | `tsvector null` | PostgreSQL weighted search vector |
| `extractor_version` | `text null` | Enables safe reprocessing |
| `updated_at` | `timestamptz` | Server timestamp |

### `note_ratings`

| Column | Type | Rule |
| --- | --- | --- |
| `note_id` | `uuid` | FK to `notes` |
| `user_id` | `uuid` | Server-derived rater |
| `rating` | `smallint` | Integer from 1 through 5 |
| `created_at`, `updated_at` | `timestamptz` | Server timestamps |

Primary key: `(note_id, user_id)`. Self-ratings are rejected. A rating operation
must verify current read access before insert or update.

### `note_rating_summaries`

Server-maintained, one row per note:

- `note_id`
- `rating_count`
- `average_rating`
- `effective_rating_count`
- `weighted_score`
- `last_rated_at`
- `updated_at`

Clients may read summaries only for notes they may read. They cannot mutate the
table.

### `note_reports`

One student may have at most one open report per note.

- `id`, `note_id`, `reporter_id`
- `category`: `copyright`, `unsafe_file`, `wrong_scope`, `misleading`,
  `harassment`, `spam`, or `other`
- `details` with a strict length limit
- `status`: `open`, `reviewing`, `resolved`, or `dismissed`
- `created_at`, `resolved_at`

Reporters may create and view their own reports. Note owners cannot see reporter
identity or report details.

### `note_moderation_actions` and `platform_roles`

Moderation actions form an append-only audit record with actor, note, action,
reason code, safe owner-facing explanation, and timestamp. No client may edit or
delete this history.

`platform_roles` is a server-owned mapping for `platform_moderator` and
`platform_admin`. University membership roles remain campus-scoped; a verified
campus moderator may review university notes only for that same university.
Public notes and cross-university actions require a platform role.

## 6. Lifecycle state machines

### Publication

```text
draft -> processing -> published
  |          |
  |          -> failed -> processing
  -> deleted

published -> deleted -> restored as published
published -> superseded (represented by superseded_by_note_id)
```

`publication_status` and deletion timestamps are separate so a deleted draft
can return to draft while a deleted published note returns to published.

### Moderation

```text
clear -> under_review -> clear
                      -> restricted -> clear
                                    -> removed
```

- `under_review` remains readable unless a moderator explicitly restricts it.
- `restricted` and `removed` are hidden from ordinary readers and blocked from
  search, downloads, ratings, and roadmap use.
- Owners and authorized moderators may read limited metadata needed for appeal
  or restoration; access to the underlying file is a separate moderated action.

## 7. Permission matrix

| Actor | Public note | University note | Create/publish | Rate | Delete/restore | Moderate |
| --- | --- | --- | --- | --- | --- | --- |
| Anonymous | No | No | No | No | No | No |
| Authenticated, onboarding incomplete | No | No | No | No | No | No |
| Onboarded, membership pending/rejected | Read/download public | No | Public only | Readable public notes except own | Own notes | No |
| Verified student | Read/download public | Same verified university only | Public or own verified university | Any readable note except own | Own notes | No |
| Note owner | Own drafts, published notes, and Trash | Own notes even after membership change | Subject to publication rules | Never own note | Own notes only | No |
| Verified campus moderator | Public as a student | Same university plus restricted moderation view | Same as student | Same as student | Own notes | Same-university university notes |
| Platform moderator/admin | Authorized moderation view | Authorized moderation view | Normal owner rules | Normal rating rules | Own notes; retention operations are audited | All notes within assigned role |

Additional rules:

- A direct note ID, stale search result, cached page, or storage object key never
  expands permission.
- Losing university verification immediately removes ordinary access to that
  university's notes, including rating updates and new download grants.
- Existing ratings remain part of the aggregate if they were valid when cast,
  but a user who loses access cannot read or update the underlying rating row.
- Owner access does not make a university note visible in the owner's new
  university.
- Restricted, removed, or deleted content overrides ordinary readership.

## 8. RLS and server-authorization contract

All notes tables use RLS with `force row level security`. Table privileges are
granted narrowly. Critical mutations use database functions or server actions
instead of direct client writes.

Authorization is operation-specific. The canonical metadata decision is
logically:

```text
owner_metadata_access
OR (
  eligible_student
  AND published
  AND not_deleted
  AND moderation_allows_read
  AND (
    visibility = public
    OR (
      visibility = university
      AND verified_membership.university_id = note.university_id
    )
  )
)
OR authorized_moderation_access
```

The owner branch exposes the owner's draft, published, failed, and Trash
metadata. It does not automatically authorize a new file download. Preview,
download, search, rating, and roadmap operations additionally require a ready
asset, no deletion timestamp, and a moderation state that permits that specific
operation. In particular, a deleted or restricted note cannot issue a new
ordinary download URL, even to its owner, until it is restored or the
restriction is resolved.

Implementation requirements:

- Reusable SQL authorization helpers must be narrowly scoped, use
  `security definer` only when necessary, set `search_path = ''`, schema-qualify
  every reference, and revoke execution from roles that do not need it.
- `owner_id`, `user_id`, university scope, aggregate values, timestamps, and
  lifecycle transitions are server-derived.
- The browser never supplies an authoritative role, membership status,
  university ID, rating count, moderation status, deletion deadline, or storage
  key.
- The Next.js server uses the user's cookie-backed Supabase client so RLS still
  applies. The application does not require a service-role key.
- Storage RLS and signed-download operations call the same logical read
  decision as note metadata. Metadata access without file access, or file
  access without metadata access, is a security bug.
- Queries return a fixed page size and use stable cursor pagination. Counts and
  snippets must not reveal inaccessible university content.

## 9. Server-owned operations

The UI calls validated server actions or route handlers. These call narrowly
scoped database functions where atomic state changes are required.

| Operation | Required guarantees |
| --- | --- |
| `create_note_draft` | Requires eligible user; derives owner; creates opaque upload intent |
| `finalize_note_upload` | Confirms owner, expected object, MIME, size, checksum, and processing result |
| `publish_note` | Validates metadata and ready asset; derives university; atomically publishes |
| `update_note_metadata` | Owner only; revalidates publication invariants; cannot replace published file |
| `list_notes` / `search_notes` | Applies access before ranking, snippets, counts, and pagination |
| `get_note` | Rechecks current read permission |
| `create_note_download` | Rechecks read permission and returns a short-lived signed URL |
| `rate_note` | Rechecks read permission, rejects self-rating, upserts 1–5, refreshes summary |
| `delete_note` | Owner only; atomically sets 30-day Trash window |
| `restore_note` | Owner only; requires current time before purge deadline and no blocking moderation state |
| `report_note` | Requires read access; prevents spam and duplicate open reports |
| `moderate_note` | Requires scoped moderator role; writes append-only audit action |
| `purge_expired_notes` | Scheduled, idempotent, honors retention holds, removes private objects last |

Publication, rating, deletion, restoration, and moderation functions should
return safe result records instead of exposing internal rows.

## 10. Rating and ranking contract

The product claim requires both rating volume and recency to matter. The initial
ranking uses a recency-weighted Bayesian score:

```text
rating_weight(age_days) = 0.5 ^ (age_days / 365)
effective_count = sum(rating_weight)
weighted_score =
  (sum(rating * rating_weight) + prior_strength * cohort_mean)
  / (effective_count + prior_strength)
```

Initial constants:

- Rating half-life: 365 days.
- Prior strength: 8 effective ratings.
- Default cohort mean when insufficient data exists: 3.5.
- Public-note cohort: public notes in the same subject.
- University-note cohort: notes in the same subject and university.

This prevents one recent 5-star rating from outranking a note with sustained
community trust. The summary exposes raw count and ordinary average for
transparency; `weighted_score` is for ordering. A note with zero ratings is
labelled **Unrated**, even if the ranking system internally uses the default
prior.

Ranking recalculation is deterministic, testable, and server-owned. Future
anti-abuse signals may demote suspicious activity but cannot silently alter the
stored ratings students submitted.

## 11. Search and extraction contract

The first browse release may filter titles, subjects, types, and tags. Full-text
search follows as a separate slice.

Postgres is the default first search boundary because RLS remains attached to
the source rows. A GIN index may weight:

1. title,
2. subject name/code and tags,
3. description,
4. extracted file text.

Extracted text is untrusted input. It is normalized for indexing and plain-text
snippets; it is never rendered as HTML or treated as instructions.

If ClassVault later adopts an external search engine:

- The index stores only the minimum metadata required for retrieval.
- Public and university scope are partitioned or filterable by immutable IDs.
- Every result ID is re-authorized against Postgres before metadata, snippets,
  or counts reach the user.
- Search-engine filtering alone is not an authorization mechanism.
- Deletion, restriction, university changes, and purge events remove or
  invalidate indexed documents promptly.

## 12. Storage contract

The storage provider remains intentionally undecided. The application depends
on a small adapter boundary:

- create expiring upload grant,
- inspect uploaded object metadata,
- create expiring download grant,
- delete source and preview objects,
- verify object existence and checksum.

Whether implemented with Supabase Storage or another provider, the source and
preview buckets are private. Signed URLs are short-lived (target: five minutes)
and are created only after current note authorization succeeds. Public object
URLs are prohibited.

Storage credentials, signing secrets, and service-role keys are never exposed
through `NEXT_PUBLIC_*` variables. Filenames and object paths do not contain
student emails, phone numbers, display names, or university names.

## 13. Privacy, trust, and moderation

- Feeds display the owner's current pseudonymous `profiles.display_name` and
  optional avatar. They never display Auth email, phone number, academic email,
  membership evidence, or reporter identity.
- Note owners can see aggregate ratings, not a public list of raters.
- Moderator access to Auth identity is separate from content-moderation access
  and requires an explicit support/admin purpose.
- Exact-file hashes help detect accidental duplicates but are not shown to
  students and are not proof of copyright ownership.
- Upload and report actions are rate-limited server-side.
- File scanning failures block publication; they do not silently publish.
- A restricted or removed note cannot be downloaded with a newly issued URL.
  Short signed-URL lifetime limits, but cannot fully revoke, an already issued
  URL before expiry.
- Moderation actions are auditable and include a safe reason visible to the
  owner. Reporter identity remains private.

## 14. Roadmap authorization foundation

The static roadmap authorization boundary is implemented in
`20260826000000_create_study_roadmap_foundation.sql`. Roadmap creation snapshots
the complete server-selected note pool; the browser cannot choose a source
owner, plan, or note list. Free snapshots include the owner's active published
uploads plus accessible public notes. The Pro-ready entitlement branch also
includes accessible same-university peer notes, but billing is not connected.

Each saved section cites one or more snapshotted note IDs. Authorization is
rechecked whenever an owner or share-token viewer opens the roadmap. If any
cited note is deleted, purged, restricted, removed, or inaccessible to that
viewer, the entire derived section is withheld. Owners retain roadmap access to
their own active old-university uploads after a membership change, while a
source link is shown only when ordinary note consumption is still authorized.

Task progress is private to the roadmap owner. Share tokens are revocable;
anonymous viewers can see only sections derived entirely from public notes,
and authenticated campus viewers must still satisfy every university-source
boundary. Static content can be saved only through the service-role worker
boundary. AI prompting, source-text retrieval, model calls, and evaluation are
not implemented.

## 15. Acceptance criteria

The first notes release is not complete until automated tests demonstrate all
of the following:

1. Anonymous and onboarding-incomplete users cannot query note metadata or
   source objects.
2. A pending or rejected member can create, read, rate, and download public
   notes but cannot access any university note.
3. A verified student can access university notes only for their own current
   university.
4. Cross-university direct-ID, search, count, preview, signed-URL, and storage
   path attempts return no protected data.
5. The server ignores or rejects client attempts to choose another owner,
   university, role, score, lifecycle state, or object key.
6. A published note cannot replace its file while retaining ratings.
7. An owner cannot rate their own note; another eligible reader can create and
   update exactly one 1–5 rating.
8. Rating aggregates and weighted scores update correctly and cannot be written
   directly by clients.
9. Deletion immediately removes a note from all ordinary reads and downloads,
   while the owner's Trash retains restorable metadata.
10. Restoration before 30 days returns the same note and ratings; restoration
    after the deadline fails.
11. Purge is idempotent, honors retention holds, and removes metadata and
    private objects without orphaning one side.
12. Restricted and removed notes are unavailable to ordinary readers even when
    visibility and university membership would otherwise allow access.
13. Public views expose only pseudonymous profile fields and never Auth or
    academic identity.
14. Search and roadmap source selection produce the same authorization
    result as direct note reads.

Tests must exercise RLS with at least: two verified users in different
universities, one pending user, one note owner, one ordinary reader, one campus
moderator, and one platform moderator.

## 16. Recommended implementation slices

1. **Schema and authorization foundation — complete 2026-08-10** — tables,
   constraints, helper functions, least-privilege grants, forced RLS policies,
   seed subjects, generated types, and 38 hosted adversarial pgTAP tests.
2. **Draft and upload pipeline** — private storage adapter, upload intent,
   validation, processing states, and publication RPC.
3. **Browse, detail, and download** — authorized feeds, metadata view, preview,
   short-lived signed downloads, filters, and pagination.
4. **Ratings and ranking** — rating mutation, summary maintenance, deterministic
   weighted score, and sort options.
5. **Trash and recovery** — delete, restore, scheduled purge, retention holds,
   and storage cleanup.
6. **Reports and moderation — complete 2026-08-23** — report intake, scoped
   roles, restrictions, removal, audit history, and owner-facing reasons.
7. **Full-text search — complete 2026-08-25 for metadata and PDFs** — a
   service-role extraction worker, weighted Postgres search, permission-safe
   snippets, and explicit failed/unsupported states. OCR for image notes and an
   external search engine remain deferred.
8. **Roadmap authorization foundation — complete locally 2026-08-24** —
   private static snapshots, automatic plan-aware source selection, cited
   sections/tasks, owner-only progress, revocable shares, and view-time source
   reauthorization. AI generation remains deferred.

Every slice includes typecheck, lint, production build, unit tests, and RLS
integration tests. Storage and search providers remain behind replaceable
boundaries.

## 17. Decisions intentionally deferred

These choices are not required to begin the schema and authorization slice:

- Object-storage provider and production file-size/storage quotas.
- PDF preview, text extraction, OCR, and malware-scanning providers.
- External search engine.
- Copyright counter-notice and legal-hold procedures.
- Account-deletion treatment for published notes.
- Whether public notes become anonymously shareable in a later product version.
- Moderator staffing, appeal workflow, and retention duration for audit data.

An implementation must not silently choose an expensive or irreversible
provider while these remain open.

## 18. Landing-page claim traceability

| Current claim | Specification contract |
| --- | --- |
| PDF or image uploads | One validated PDF/JPEG/PNG/WebP source asset per MVP note |
| Public or university scope | Signed-in public scope or verified immutable university scope |
| At least one subject tag | Required normalized `subject_id`; optional additional tags |
| 1–5 student ratings | One mutable 1–5 rating per eligible non-owner reader |
| Weighted by count and recency | Recency-weighted Bayesian score with published constants |
| Search titles, tags, and file text | Permission-filtered Postgres search with derived text document |
| Download notes | Short-lived authorized download grant from private storage |
| 30-day recovery with ratings intact | Soft deletion plus exact purge deadline and preserved rating rows |
| University notes are not paywalled | Access depends on verified membership, never subscription tier |
| Roadmaps use only allowed notes | Authorization rechecked at generation and every later view |
