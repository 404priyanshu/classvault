# ClassVault Product Roadmap

Goal: grow ClassVault from a moderated note library into the place a class runs
its academic life: find, read, discuss, organize, and get notified, with AI
assistance layered on top.

Effort: **S** <= 1 day, **M** = 2-4 days, **L** = 1-2 weeks.

## Current Progress

| Area | Status | Notes |
| --- | --- | --- |
| Core library | Shipped | Search, filters, saves, ratings, downloads, reports |
| Auth | Shipped | Password fallback, Google OAuth, email OTP, college verification |
| Uploads | Shipped | Local/S3-compatible storage, reviewed uploads, staff moderation |
| Inline PDF preview | Shipped | Drawer preview plus expanded full-screen viewer |
| Full-text search | Shipped | Postgres `tsvector` + ranked multi-word search |
| Trending notes | Shipped | `GET /api/notes?sort=trending`, dashboard strip, library sort control, e2e coverage |
| Comments / Q&A | Shipped | One-level replies, delete, staff hide |
| In-app notifications | Shipped | Moderation and comment notifications, bell UI |
| Reputation + leaderboard | Shipped | Contributor score excludes self-downloads |
| AI roadmaps | Shipped | Gemini primary, OpenAI fallback |
| Exam Mode | Shipped | High-yield crash-prep plan |
| AI note suggestions | Shipped | Upload description/tag suggestions |
| Collections | Shipped + QA hardened | Private/public note sets, `/app/collections`, public `/c/[slug]`, app-flow and slug-visibility coverage |
| Study tasks | Shipped | DB-backed task list |
| Open-source docs | In progress | README/CONTRIBUTING polished; license still missing |

## Next Work

| Priority | Feature | Effort | Why next |
| --- | --- | --- | --- |
| P0 | Comments + notifications QA | S | Core logic unit-tested; remaining: Playwright e2e for authed reply/owner/staff-hide/bell flows |
| P1 | Open-source release prep | S | Add `LICENSE`, screenshots/GIF, issue labels, public demo link |
| P2 | Course entities | L | Follow course pages, course feeds, follower notifications |
| P2 | Note versioning | M | Replace files while preserving ratings, saves, comments |
| P2 | PWA/offline shell | M | Better mobile install and repeat study sessions |
| P3 | Admin analytics | M | Ops view for uploads, approvals, reports, health |
| P3 | Ask your notes | L | Needs pgvector, embeddings, citations, extraction pipeline |
| P3 | Email notifications | M | Reuse in-app notification fan-out with digest controls |

## Phase 1: Discovery Polish

### Trending UI - Done

Backend supports ranking notes by recent `DownloadEvent` activity. Shipped:

- Dashboard strip: "Trending this week".
- Library sort control: recent/trending.
- Empty state while downloads build up.
- E2E coverage for dashboard and library `sort=trending` query behavior.

Risk: low. If download volume is small, fall back to all-time `downloadCount`.

### Full-Text Search Follow-Up - S

Search is implemented. Remaining polish:

- Add UI hint for multi-word search.
- Add tests covering ranked result order plus course-code fallback.
- Consider highlighting matched terms later.

## Phase 2: Community QA

### Comments + Notifications QA - In progress

The models, routes, and UI exist. The core logic is now extracted into pure,
unit-tested helpers (`tests/comment-logic.test.ts`, `tests/notification-format.test.ts`):

- `assembleCommentThread` - one-level nesting, deleted-placeholder rules, and the
  rendered-only count.
- `commentFanoutTargets` - reply vs new-comment recipients, de-duplicated, never
  notifying the commenter (covers reply, owner-notify, and self-comment cases).
- `describeNotification` - bell title/detail for every notification type, shared
  with the bell UI.

Remaining: full Playwright e2e for the authenticated reply / owner-notify /
staff-hide / bell unread + mark-read flows (needs seeded moderator and author
sessions).

Risk: moderation/reporting policy. Comment reports are not first-class yet; staff hide exists.

### Leaderboard Follow-Up - S

Leaderboard is live. Remaining polish:

- Show contributor score explanation in UI.
- Add tests for self-download exclusion.
- Add lightweight cache if query gets slow.

## Phase 3: Organization

### Collections QA Hardening - Done

Collections are shipped with coverage for:

- Creating a collection.
- Opening collection detail.
- Toggling public/private state.
- Surfacing the public share path.
- Removing notes.
- Deleting a collection.
- Public `/c/[slug]` visibility rules for anonymous visitors and collection owners.

### Courses As Entities - L

Make course codes first-class:

```prisma
model Course {
  id         String @id @default(cuid())
  code       String @unique
  title      String
  department String?
  notes      Note[]
  followers  CourseFollow[]
}

model CourseFollow {
  userId   String
  courseId String
  @@id([userId, courseId])
}
```

Plan:

- Backfill `Course` rows from distinct `Note.courseCode`.
- Add nullable `Note.courseId` while preserving legacy `courseCode`.
- Build course pages with notes, followers, and top contributors.
- Notify followers when new notes are approved.

Risk: largest schema change. Ship migration/backfill separately from UI.

### Note Versioning - M

Allow uploaders to replace files without losing social proof.

- Add `NoteVersion(noteId, storageKey, fileSizeBytes, pageCount, createdAt)`.
- Keep current pointer on `Note`.
- New version re-enters `PENDING` moderation.
- Show version history in note detail.

## Phase 4: AI Depth

### Ask Your Notes - L

Semantic Q&A over uploaded resources.

- Extract text from PDFs/docs.
- Chunk and embed content.
- Store embeddings with pgvector.
- Answer with citations: note title, section/page when available.

Risk: infra and cost. Schedule after comments/search usage proves demand.

### AI Upload Metadata Follow-Up - M

Suggestions exist. Remaining depth:

- Extract first pages of uploaded PDFs instead of relying only on filename/user metadata.
- Better fallback for scanned PDFs.
- Track acceptance rate for AI-generated tags/descriptions.

## Phase 5: Platform Polish

### PWA / Offline - M

- Manifest and installable shell.
- Cache app chrome and safe static assets.
- Later: offline saved-note metadata.

### Admin Analytics - M

Staff-only view for:

- Upload volume.
- Approval/rejection rate.
- Report backlog.
- Downloads and ratings over time.
- Storage/health checks.

### Email Notifications - M

Reuse `Notification` fan-out:

- Digest mode by default.
- Per-event opt-in later.
- Resend/SES transport behind existing email config.

## Release Readiness

Before public OSS release:

- Add `LICENSE`.
- Add README screenshots/GIF.
- Add demo URL.
- Add issue labels and a small "good first issue" set.
- Re-run `pnpm prisma validate`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`.
