# ClassVault Product Roadmap

Goal: grow ClassVault from a moderated note library into the one place a class
runs its academic life — find, read, discuss, organize, and get notified, with
AI assistance layered on top.

Every feature below builds on what already exists (Prisma/Postgres on Neon,
cookie sessions + Google OAuth, S3/local storage, moderation pipeline,
DB-backed rate limits). Effort: **S** ≤ 1 day, **M** = 2–4 days, **L** = 1–2 weeks.

## Overview

| Phase | Feature | Effort | Depends on | Moves |
| ----- | ------- | ------ | ---------- | ----- |
| 1 — Now | Inline PDF preview | S | nothing (API already supports it) | engagement |
| 1 — Now | Full-text search | M | nothing | discovery |
| 1 — Now | Trending section | S | nothing | discovery |
| 2 — Next | Comments / Q&A | M | nothing | engagement |
| 2 — Next | In-app notifications | M | nothing | retention |
| 2 — Next | Reputation + leaderboard | S–M | nothing | note supply |
| 3 — Next | Collections (exam sprints) | M | nothing | retention |
| 3 — Later | Courses as entities | L | notifications | structure, retention |
| 3 — Later | Note versioning | M | nothing | quality |
| 4 — Later | AI summary + tag suggestions | M | `ANTHROPIC_API_KEY` | upload quality |
| 4 — Later | "Ask your notes" semantic search | L | pgvector, embeddings | discovery |
| 5 — Later | Email notifications | M | in-app notifications | retention |
| 5 — Later | PWA / offline | M | nothing | mobile reach |
| 5 — Later | Admin analytics dashboard | M | nothing | operations |
| 5 — Later | Server-side study tasks | S | nothing | retention |

---

## Phase 1 — Reader & discovery

Highest value per unit of effort. All three are independent of each other.

### Inline PDF preview — S

*As a student, I read a note in the app before deciding to download it.*

- **Server: done.** `GET /api/notes/:id/file?disposition=inline` already
  streams with `Content-Disposition: inline` (local) or redirects to a signed
  URL with inline response headers (S3).
- **UI:** "Preview" button in the detail drawer opens a modal (or expands the
  drawer) with an `<iframe src="/api/notes/{id}/file?disposition=inline">`.
  PDFs render natively in every modern browser; show a "download to view"
  fallback for DOCX/PPTX/ZIP.
- **Risk:** signed-URL redirect inside an iframe must keep response
  `Content-Disposition` inline — already handled by `createDownloadUrl`'s
  response-header overrides; verify once against the live bucket.

### Postgres full-text search — M

*As a student, searching "deadlock semaphore" finds the OS notes even though
no field contains that exact phrase.*

- Migration: generated `tsvector` column on `Note` over
  `title || description || topic || subject`, `GIN` index.
- `lib/server/notes.ts#listNotes`: when `q` has ≥ 2 words use
  `websearch_to_tsquery('english', q)` ranked by `ts_rank`, else keep the
  current insensitive `contains` (good for course codes like `CS302`).
  Implemented with `$queryRaw` for the id list, then the existing
  include/serialize path — serializer untouched.
- **Risk:** raw SQL must stay inside `lib/server/notes.ts`; keep the Zod-parsed
  `q` as a bound parameter (never interpolated).

### Trending — S

*As a student, I see what my batch is actually using this week.*

- `DownloadEvent` rows already carry `createdAt`; score = downloads in the last
  7 days. One `groupBy` query, surfaced as `GET /api/notes?sort=trending` plus
  a "Trending this week" dashboard strip.
- **Risk:** none meaningful; index on `DownloadEvent(noteId, createdAt)` if slow.

---

## Phase 2 — Community

### Comments / Q&A on notes — M

*As a student, I ask "does this cover the 2024 syllabus?" on the note itself
instead of in a group chat.*

```prisma
model Comment {
  id        String   @id @default(cuid())
  noteId    String
  authorId  String
  parentId  String?            // one level of replies
  body      String             // 1..2000 chars (Zod)
  status    CommentStatus @default(VISIBLE) // VISIBLE | HIDDEN | DELETED
  createdAt DateTime @default(now())
  @@index([noteId, createdAt])
}
```

- Routes: `GET/POST /api/notes/:id/comments`, `DELETE /api/comments/:id`
  (author or staff). Reuse `requireCurrentUser`, `assertRateLimit`
  (e.g. 30/hour), and the moderation pattern from `lib/server/moderation.ts`
  (staff hide + `ModerationEvent` audit row).
- UI: thread under the tags section in the detail drawer; reply one level deep.
- **Risk:** moderation load — mitigate with rate limit + report-comment reuse
  of the existing `Report` flow (add `commentId` nullable column).

### In-app notifications — M

*As an uploader, I learn my note was approved (or why it was rejected) without
checking the uploads tab.*

```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String
  type      String    // NOTE_APPROVED | NOTE_REJECTED | COMMENT_REPLY | ...
  payload   Json      // noteId, commentId, reason, ...
  readAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([userId, readAt, createdAt])
}
```

- Fan-out points: `moderateNote` in `lib/server/moderation.ts`
  (approve/reject), comment creation (note owner + parent author).
- Routes: `GET /api/notifications` (latest 20 + unread count),
  `POST /api/notifications/read`.
- UI: bell in the top bar, badge with unread count, dropdown list; poll every
  60 s (no websockets yet — keep it boring).
- **Why before courses:** course-follow fan-out (Phase 3) reuses this exact
  pipeline.

### Reputation + leaderboard — S–M

*As a contributor, my uploads earn visible credit, so I keep uploading.*

- No new model to start: score computed live —
  `published uploads × 10 + downloads received × 1 + (avg rating ≥ 4.5 ? 25 : 0)`.
- `GET /api/leaderboard` (top 20, cached 5 min), score shown on profile and
  next to uploader names in the drawer.
- **Risk:** gaming via self-downloads — `DownloadEvent.userId` exists, so
  exclude self-downloads from the score query. Promote to a cached column only
  if the live query gets slow.

---

## Phase 3 — Organization

### Collections ("exam sprints") — M

*As a student, I bundle the 8 resources for next week's DBMS end-sem into one
named set and share it with my class.*

```prisma
model Collection {
  id        String   @id @default(cuid())
  ownerId   String
  title     String
  slug      String   @unique          // share-by-link
  isPublic  Boolean  @default(false)
  notes     CollectionNote[]
}
model CollectionNote {
  collectionId String
  noteId       String
  position     Int
  @@id([collectionId, noteId])
}
```

- CRUD routes under `/api/collections`; "Add to collection" action in the
  drawer; new sidebar tab; public page at `/c/[slug]` for shared sets.

### Courses as first-class entities — L

*As a student, I follow CS302 and get notified when anything new lands.*

- `Course` (code unique, title, department) + `CourseFollow(userId, courseId)`.
- Migration backfills `Course` rows from distinct `Note.courseCode` values,
  then `Note.courseId` FK alongside the legacy string until the UI flips.
- Course pages: header, follower count, notes list, top contributors.
- Publish hook: on approve, notify followers (reuses Notification fan-out —
  hence sequenced after Phase 2).
- **Risk:** largest schema change in the roadmap; do the backfill migration in
  its own deploy and keep `courseCode` string until verified.

### Note versioning — M

*As an uploader, I replace my Unit-2 notes with the corrected PDF without
losing ratings, saves, or comments.*

- `NoteVersion(noteId, storageKey, fileSizeBytes, pageCount, createdAt)`;
  current pointer stays on `Note`. "Upload new version" only for `ownedByMe`,
  re-enters `PENDING` review; history list in the drawer.

---

## Phase 4 — AI (needs `ANTHROPIC_API_KEY`; per-call cost)

### Auto-summary + suggested tags at upload — M

*As an uploader, the description and tags write themselves; I just confirm.*

- After the file lands in storage, server extracts PDF text (first ~10 pages,
  `pdf-parse`), calls Claude (`claude-haiku-4-5` — cheap, fast) for a 2-sentence
  summary + ≤ 6 tags, returns them to the upload dialog as editable prefills.
- Strictly assistive: user reviews before submit; moderation still applies.
- **Risk:** scanned/image PDFs yield no text — fall back silently to manual
  entry. Rate-limit the endpoint like uploads.

### "Ask your notes" — L (Later)

*As a student, I ask "how does BCNF differ from 3NF?" and get an answer citing
the exact notes that cover it.*

- pgvector extension on Neon, chunked note text + embeddings table, retrieval
  endpoint that answers with citations (note title + page).
- Largest infra addition in the roadmap; schedule only after Phase 1–2 prove
  engagement, and after auto-summary establishes the text-extraction pipeline.

---

## Phase 5 — Platform polish (Later)

- **Email notifications** — Resend integration behind the same Notification
  fan-out; digest option instead of per-event spam.
- **PWA** — manifest + service worker shell so the library installs on phones;
  pairs well with signed-URL downloads.
- **Admin analytics** — uploads/downloads/ratings over time from the event
  tables that already exist; one staff-only dashboard view.
- **Server-side study tasks** — the dashboard task list is currently client
  state only and vanishes on refresh; smallest possible model
  (`StudyTask(userId, title, done)`) + two routes makes it real. Effort S and
  arguably Phase 1 material if quick wins are needed.

---

## Sequencing rationale

```
Phase 1 (independent quick wins)
  preview ─┐
  search  ─┼─→ Phase 2: comments ─→ notifications ─→ Phase 3: courses (fan-out reuse)
  trending ┘                         leaderboard      collections, versioning
                                                        └─→ Phase 4: AI summary ─→ ask-your-notes
```

- Preview/search/trending ship in any order — no schema changes beyond one
  generated column.
- Notifications before courses: course-follow is only valuable with a delivery
  mechanism.
- Comments before AI Q&A: engagement data shows whether deep retrieval is
  worth the infra.
- Every phase leaves the app deployable; no feature blocks the campus beta.
