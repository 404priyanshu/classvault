# ClassVault Backend Build Guide

This guide is for building the backend yourself while keeping the current frontend usable at every stage.

Current app state:

- Framework: Next.js App Router.
- Main app screen: `app/app/page.tsx`.
- App shell: `components/app-shell/app-shell.tsx`; routed app views live under `app/app/*` and `components/views/*`.
- Static data source: `lib/classvault-data.ts`.
- Current frontend behavior: browse notes, filter notes, save notes, rate notes, count downloads, upload a draft note, view current user data.

Goal: replace static frontend state with real backend behavior in small steps.

## 1. Backend Scope

Build these backend capabilities, in this order:

1. Health check endpoint.
2. Database connection.
3. Notes read API.
4. Notes search/filter API.
5. User model.
6. Saved notes API.
7. Ratings API.
8. Downloads API.
9. Upload metadata API.
10. File storage.
11. Authentication.
12. Authorization.
13. Frontend integration.
14. Tests.
15. Deployment.

Do not start with authentication or file uploads. They create extra complexity before the core data model is proven.

## 2. Recommended Stack

Use this stack unless you have a specific reason not to:

- Backend runtime: Next.js Route Handlers under `app/api`.
- Database: PostgreSQL.
- ORM: Prisma.
- File storage: AWS S3 for release uploads, with local filesystem fallback in development.
- Validation: Zod.
- Authentication: Auth.js, Clerk, or custom session auth.

Reasoning:

- The app is already Next.js, so Route Handlers avoid adding a separate backend server too early.
- PostgreSQL handles search, relational data, counters, and future moderation workflows well.
- Prisma gives you migrations, typed models, and a beginner-friendly schema file.
- S3 keeps uploaded files out of the database.

## 3. Target Data Model

Start with these entities.

### User

Represents a student, uploader, or future admin.

Fields:

- `id`: unique ID.
- `name`: display name.
- `email`: unique email.
- `role`: app role, for example `STUDENT`, `MODERATOR`, `ADMIN`.
- `department`: optional department, for example `CSE`.
- `semester`: optional current semester.
- `avatarUrl`: optional profile image URL.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.

Frontend replacement:

- Replaces `currentUser` from `lib/classvault-data.ts`.
- Powers avatar, profile, uploads ownership, and saved notes.

### Note

Represents one uploaded study resource.

Fields:

- `id`: unique ID.
- `title`: note title.
- `description`: short summary.
- `subject`: subject name.
- `semester`: semester number as string or integer.
- `courseCode`: course code.
- `unit`: unit label.
- `topic`: topic label.
- `fileType`: `PDF`, `DOCX`, `PPTX`, or `ZIP`.
- `fileSizeBytes`: numeric file size.
- `pageCount`: optional page count.
- `storageKey`: object storage key.
- `publicUrl`: optional public URL if files are public.
- `coverImageUrl`: optional card image.
- `ownerId`: uploader user ID.
- `status`: `DRAFT`, `PUBLISHED`, `HIDDEN`, or `DELETED`.
- `createdAt`: upload timestamp.
- `updatedAt`: last update timestamp.

Frontend replacement:

- Replaces every item in `initialNotes`.
- Powers note cards, details panel, uploads tab, search, filters, and download button.

### Tag

Represents searchable labels such as `DBMS`, `SQL`, `Normalization`, or `PYQs`.

Fields:

- `id`: unique ID.
- `name`: unique tag name.

### NoteTag

Join table between notes and tags.

Fields:

- `noteId`: note ID.
- `tagId`: tag ID.

### SavedNote

Represents one user saving one note.

Fields:

- `userId`: user ID.
- `noteId`: note ID.
- `createdAt`: save timestamp.

Constraint:

- Unique pair: `userId + noteId`.

Frontend replacement:

- Replaces `savedIds` state.
- Powers the saved tab and bookmark buttons.

### Rating

Represents one user rating one note.

Fields:

- `userId`: user ID.
- `noteId`: note ID.
- `value`: integer from `1` to `5`.
- `createdAt`: first rating timestamp.
- `updatedAt`: latest rating timestamp.

Constraint:

- Unique pair: `userId + noteId`.

Frontend replacement:

- Replaces the local `rateNote` behavior.
- Powers average rating and rating count.

### DownloadEvent

Represents a download action.

Fields:

- `id`: unique ID.
- `userId`: optional user ID.
- `noteId`: note ID.
- `createdAt`: timestamp.
- `ipHash`: optional hashed IP for abuse detection.

Frontend replacement:

- Replaces local `downloadNote` increments.
- Powers download count.

## 4. API Contract

Use JSON for all metadata APIs. Use signed upload/download URLs for files.

### `GET /api/health`

Purpose: prove the backend route system works.

Response:

```json
{
  "ok": true,
  "service": "classvault-api"
}
```

Build this first before touching the database.

### `GET /api/notes`

Purpose: return published notes for the dashboard.

Query parameters:

- `q`: optional search text.
- `subject`: optional exact subject.
- `semester`: optional exact semester.
- `tag`: optional exact tag.
- `owner`: optional `me` to show current user's uploads.
- `saved`: optional `true` to show current user's saved notes.
- `limit`: default `20`.
- `cursor`: optional pagination cursor.

Response:

```json
{
  "items": [
    {
      "id": "note_dbms_unit2",
      "title": "DBMS - Unit 2 Notes",
      "description": "Comprehensive notes covering relational model, SQL, constraints, and normalization.",
      "subject": "Database Systems",
      "semester": "5",
      "courseCode": "CS302",
      "unit": "Unit 2",
      "topic": "Relational Model & SQL",
      "fileType": "PDF",
      "fileSizeBytes": 1800000,
      "pageCount": 24,
      "uploader": {
        "id": "user_123",
        "name": "Neha Sharma",
        "roleLabel": "CSE, 5th Semester",
        "avatarUrl": "/avatar_neha.png"
      },
      "tags": ["DBMS", "Relational Model", "SQL"],
      "ratingAverage": 5,
      "ratingCount": 312,
      "downloadCount": 2400,
      "savedByMe": true,
      "createdAt": "2024-05-12T00:00:00.000Z",
      "coverImageUrl": "/card_dbms.png"
    }
  ],
  "nextCursor": null
}
```

Important rule:

- The frontend should not calculate rating averages or download totals from raw events.
- The API should return display-ready counts.

### `GET /api/notes/:id`

Purpose: return details for one note.

Response:

```json
{
  "id": "note_dbms_unit2",
  "title": "DBMS - Unit 2 Notes",
  "description": "Comprehensive notes covering relational model, SQL, constraints, and normalization.",
  "subject": "Database Systems",
  "semester": "5",
  "courseCode": "CS302",
  "unit": "Unit 2",
  "topic": "Relational Model & SQL",
  "fileType": "PDF",
  "fileSizeBytes": 1800000,
  "pageCount": 24,
  "tags": ["DBMS", "Relational Model", "SQL"],
  "ratingAverage": 5,
  "ratingCount": 312,
  "downloadCount": 2400,
  "savedByMe": true,
  "ownedByMe": false,
  "createdAt": "2024-05-12T00:00:00.000Z"
}
```

### `POST /api/notes`

Purpose: create note metadata after a file has been uploaded.

Request:

```json
{
  "title": "Operating Systems Unit 3",
  "description": "CPU scheduling and semaphore notes.",
  "subject": "Operating Systems",
  "semester": "5",
  "courseCode": "CS301",
  "unit": "Unit 3",
  "topic": "CPU Scheduling",
  "fileType": "PDF",
  "fileSizeBytes": 1600000,
  "pageCount": 12,
  "storageKey": "notes/user_123/os-unit-3.pdf",
  "tags": ["Operating Systems", "Scheduling", "Semaphores"]
}
```

Response:

```json
{
  "id": "note_new_123",
  "status": "PUBLISHED"
}
```

Validation rules:

- `title`: required, 3 to 120 characters.
- `subject`: required.
- `semester`: required.
- `courseCode`: required.
- `fileType`: only `PDF`, `DOCX`, `PPTX`, `ZIP`.
- `fileSizeBytes`: greater than `0`.
- `storageKey`: required.
- `tags`: maximum 12 tags.

### `POST /api/notes/:id/save`

Purpose: save one note for the current user.

Response:

```json
{
  "saved": true
}
```

### `DELETE /api/notes/:id/save`

Purpose: remove one note from saved notes.

Response:

```json
{
  "saved": false
}
```

### `POST /api/notes/:id/rating`

Purpose: create or update the current user's rating.

Request:

```json
{
  "value": 5
}
```

Response:

```json
{
  "ratingAverage": 4.9,
  "ratingCount": 313,
  "myRating": 5
}
```

### `POST /api/notes/:id/download`

Purpose: record a download event and return a download URL.

Response:

```json
{
  "downloadUrl": "https://storage.example.com/signed-url",
  "downloadCount": 2401
}
```

Important rule:

- Do not expose private storage keys directly to the browser.
- Return short-lived signed URLs if files are private.

### `POST /api/uploads/presign`

Purpose: create a signed upload URL before the browser uploads a file.

Request:

```json
{
  "fileName": "dbms-unit-2.pdf",
  "fileType": "application/pdf",
  "fileSizeBytes": 1800000
}
```

Response:

```json
{
  "uploadUrl": "https://storage.example.com/signed-upload-url",
  "storageKey": "notes/user_123/dbms-unit-2.pdf"
}
```

Validation rules:

- Allow only supported MIME types.
- Set a maximum file size before signing the upload.
- Generate the storage key on the server, not in the browser.

## 5. Build Order

Follow these milestones exactly.

### Milestone 1: Create the Backend Folder Shape

Add these folders only when needed:

```text
app/api/health/route.ts
app/api/notes/route.ts
app/api/notes/[noteId]/route.ts
app/api/notes/[noteId]/save/route.ts
app/api/notes/[noteId]/rating/route.ts
app/api/notes/[noteId]/download/route.ts
app/api/uploads/presign/route.ts
lib/server/db.ts
lib/server/auth.ts
lib/server/validation.ts
lib/server/notes.ts
prisma/schema.prisma
prisma/seed.ts
```

Rules:

- Keep server-only helpers under `lib/server`.
- Keep API route files thin.
- Put business logic in `lib/server/notes.ts`.
- Put validation schemas in `lib/server/validation.ts`.
- Do not import server files into client components.

Checkpoint:

- `/api/health` returns JSON in the browser.

### Milestone 2: Install Backend Dependencies

Add these packages:

```bash
pnpm add prisma @prisma/client zod
pnpm add -D tsx
```

Then initialize Prisma:

```bash
pnpm prisma init
```

Expected result:

- `prisma/schema.prisma` exists.
- `.env` contains `DATABASE_URL`.
- The app still starts.

Checkpoint:

```bash
pnpm build
```

### Milestone 3: Define the Prisma Schema

Create models for:

- `User`
- `Note`
- `Tag`
- `NoteTag`
- `SavedNote`
- `Rating`
- `DownloadEvent`

Use enums for:

- `UserRole`
- `NoteStatus`
- `FileType`

Index fields that will be queried often:

- `Note.subject`
- `Note.semester`
- `Note.courseCode`
- `Note.status`
- `Note.ownerId`
- `Tag.name`
- `SavedNote.userId`
- `Rating.noteId`
- `DownloadEvent.noteId`

Checkpoint:

```bash
pnpm prisma validate
```

### Milestone 4: Create the First Migration

Run:

```bash
pnpm prisma migrate dev --name init
```

Expected result:

- A migration appears under `prisma/migrations`.
- The database has tables.
- Prisma Client is generated.

Checkpoint:

```bash
pnpm prisma studio
```

Use Prisma Studio only to inspect data. Do not rely on it as your main admin tool.

### Milestone 5: Seed the Existing Static Data

Create `prisma/seed.ts`.

Seed from `lib/classvault-data.ts` so the frontend does not visually change when you switch to the API.

Seed order:

1. Create users for the uploaders in static notes.
2. Create notes.
3. Create tags.
4. Connect notes to tags.
5. Create saved notes for the current user.
6. Create starter ratings as aggregate-compatible rows or seed aggregate columns.
7. Create starter download counts if using cached count columns.

Important decision:

- For a learning project, use cached fields on `Note`: `ratingAverage`, `ratingCount`, and `downloadCount`.
- Still keep `Rating` and `DownloadEvent` tables for real user actions.

Reason:

- The current UI needs fast counts.
- Full event aggregation on every page load is unnecessary complexity at the start.

Checkpoint:

```bash
pnpm prisma db seed
```

### Milestone 6: Create Database Client

Create `lib/server/db.ts`.

Rules:

- Export one Prisma client.
- Avoid creating a new client on every hot reload in development.
- Keep this file server-only.

Checkpoint:

- Import the DB client inside `/api/health`.
- Return a simple count, for example total notes.

### Milestone 7: Build `GET /api/notes`

Implement the read endpoint before any write endpoint.

Backend steps:

1. Parse query parameters.
2. Build a Prisma `where` object.
3. Always filter `status = PUBLISHED`.
4. Apply search against title, description, subject, topic, course code, and tags.
5. Apply subject, semester, tag, saved, and owner filters.
6. Include uploader and tags.
7. Return display-ready objects.

Search behavior:

- Use case-insensitive partial matching first.
- Add PostgreSQL full-text search later only if needed.

Response mapping:

- Convert `fileSizeBytes` into bytes in the API response.
- Let the frontend format file size if needed.
- Return ISO timestamps, not display strings like `12 May 2024`.

Checkpoint:

- Visiting `/api/notes` returns seeded notes.
- Querying `/api/notes?q=dbms` returns DBMS notes.
- Querying `/api/notes?semester=5` returns semester 5 notes.

### Milestone 8: Connect Frontend Read Path

Replace only the note loading path first.

Frontend changes:

1. Keep `initialNotes` temporarily as fallback.
2. Add a `useEffect` that fetches `/api/notes`.
3. Store API results in `notes`.
4. Preserve existing filtering locally for the first pass.
5. Once stable, move filtering into query parameters.

Do not change saving, rating, download, or upload yet.

Checkpoint:

- Dashboard looks the same.
- Reloading the page keeps API-loaded notes.
- If the API fails, show a simple error state.

### Milestone 9: Move Filters to the API

Current frontend filters:

- `query`
- `selectedSubject`
- `selectedSemester`
- `selectedTag`
- `activeView`

Map them to:

- `q`
- `subject`
- `semester`
- `tag`
- `saved=true`
- `owner=me`

Rules:

- Debounce search input by 200 to 400 ms.
- Reset pagination when filters change.
- Keep selected note valid; if it disappears from results, select the first returned note.

Checkpoint:

- Browser network tab shows `/api/notes?...` changing as filters change.

### Milestone 10: Add Saved Notes

Backend:

- Implement `POST /api/notes/:id/save`.
- Implement `DELETE /api/notes/:id/save`.
- Use the current user ID from a temporary auth helper at first.
- Enforce one saved row per user and note.

Frontend:

- Replace local `savedIds` mutation with API calls.
- Optimistically update the UI.
- Revert the optimistic update if the request fails.

Checkpoint:

- Save a note.
- Reload.
- The note is still saved.
- Remove it.
- Reload.
- The note is no longer saved.

### Milestone 11: Add Ratings

Backend:

- Implement `POST /api/notes/:id/rating`.
- Validate `value` is an integer from `1` to `5`.
- Upsert the user's rating.
- Recalculate `ratingAverage` and `ratingCount`.
- Return updated counts.

Frontend:

- Replace local `rateNote` mutation with an API call.
- Update the selected note and list item with returned counts.

Concurrency rule:

- Recalculate rating inside a database transaction.

Checkpoint:

- Rate a note.
- Reload.
- Rating count and average remain changed.

### Milestone 12: Add Downloads

Backend:

- Implement `POST /api/notes/:id/download`.
- Create `DownloadEvent`.
- Increment `Note.downloadCount`.
- Return a signed download URL or temporary placeholder URL.

Frontend:

- Replace local `downloadNote` mutation with an API call.
- Update visible download count from the response.
- Open the returned URL only after the API succeeds.

Checkpoint:

- Click download.
- Count increases.
- Reload.
- Count remains increased.

### Milestone 13: Add Upload Metadata

Backend:

- Implement `POST /api/notes`.
- Validate the payload.
- Require a `storageKey`.
- Create tags if they do not exist.
- Create note and tag connections in one transaction.
- Set owner to the current user.
- Set status to `PUBLISHED` for now.

Frontend:

- Replace local upload note insertion with `POST /api/notes`.
- On success, refetch notes or insert the returned note.

Checkpoint:

- Upload form creates a real database note.
- Reload.
- Uploaded note remains visible.
- Uploads tab shows it under the current user.

### Milestone 14: Add File Uploads

Do this only after metadata uploads work.

Flow:

1. Browser sends file name, MIME type, and size to `/api/uploads/presign`.
2. Server validates file.
3. Server returns `uploadUrl` and `storageKey`.
4. Browser uploads file directly to storage.
5. Browser sends note metadata plus `storageKey` to `POST /api/notes`.

Rules:

- Never upload large files through a normal JSON API route.
- Never trust the browser-provided file extension.
- Validate MIME type and size on the server.
- Use unique storage keys.
- Keep private files private unless you intentionally support public resources.

Checkpoint:

- Upload a real PDF.
- Confirm the file exists in storage.
- Confirm note metadata exists in the database.

### Milestone 15: Add Authentication

Add authentication after the core note system works.

Minimum requirements:

- User can sign in.
- API can identify current user.
- Saved notes belong to the signed-in user.
- Ratings belong to the signed-in user.
- Uploads belong to the signed-in user.
- Guest users can browse published notes.

Rules:

- Do not accept `ownerId` from the browser.
- Do not accept `userId` from the browser.
- Derive user identity from the server session.

Temporary development helper:

- Before real auth, create `getCurrentUser()` that returns the seeded current user.
- Replace its internals later without changing every endpoint.

### Milestone 16: Add Authorization

Authorization rules:

- Anyone can read published notes.
- Signed-in users can save notes.
- Signed-in users can rate notes.
- Signed-in users can download notes.
- Signed-in users can upload notes.
- Users can edit or delete only their own notes.
- Admins or moderators can hide any note.

Backend rule:

- Authorization must live in the API/server layer.
- Frontend button hiding is not security.

### Milestone 17: Add Tests

Start with backend tests around business logic.

Test these cases:

- `GET /api/notes` returns only published notes.
- Search matches title, subject, topic, course code, and tags.
- Saving the same note twice does not create duplicates.
- Removing a saved note is safe if it is already removed.
- Rating accepts only values `1` through `5`.
- Rating the same note twice updates the old rating.
- Download increments count once per request.
- Upload rejects missing title.
- Upload rejects unsupported file type.
- Upload creates tags correctly.

Manual browser checks:

- Dashboard loads from API.
- Filters work.
- Saved tab persists after reload.
- Uploads tab persists after reload.
- Rating persists after reload.
- Download count persists after reload.

## 6. API Implementation Rules

Use these rules for every route handler:

1. Validate input before touching the database.
2. Read current user on the server.
3. Return consistent JSON.
4. Return correct HTTP status codes.
5. Avoid leaking stack traces.
6. Keep route handlers thin.
7. Put reusable logic in `lib/server`.

Status code guide:

- `200`: successful read or update.
- `201`: successful create.
- `204`: successful delete with no response body.
- `400`: invalid input.
- `401`: not signed in.
- `403`: signed in but not allowed.
- `404`: resource not found.
- `409`: conflict, such as duplicate unique value.
- `500`: unexpected server error.

Error response shape:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Title is required."
  }
}
```

## 7. Frontend Replacement Map

Use this map when replacing local state.

| Current frontend item | Replace with |
| --- | --- |
| `initialNotes` | `GET /api/notes` |
| `currentUser` | server session user returned by `/api/me` |
| `savedIds` | `POST` and `DELETE /api/notes/:id/save` |
| local `rateNote` | `POST /api/notes/:id/rating` |
| local `downloadNote` | `POST /api/notes/:id/download` |
| local upload insertion | `POST /api/notes` |
| upload file name only | real storage upload plus `storageKey` |
| local filters | `/api/notes` query params |

Replacement order:

1. Read notes from API.
2. Move filters to API.
3. Persist saved notes.
4. Persist ratings.
5. Persist downloads.
6. Persist upload metadata.
7. Add real file storage.
8. Add real auth.

## 8. Database Design Rules

Use these rules to avoid future rewrites:

- Store file size as bytes, not display text.
- Store timestamps as timestamps, not display strings.
- Store rating as individual user rows plus cached aggregate fields.
- Store downloads as events plus cached count.
- Store note status instead of hard-deleting records immediately.
- Store tags in a separate table.
- Use unique constraints for user-note pairs.
- Use indexes for every common filter.

Do not store:

- Raw files in PostgreSQL.
- Comma-separated tags in one column.
- Display-only dates like `12 May 2024`.
- Download count only in frontend state.
- User IDs sent from the browser.

## 9. Learning Checklist

Work through these in order.

### Basic HTTP

Know:

- Difference between `GET`, `POST`, `PATCH`, and `DELETE`.
- What request body means.
- What query parameters mean.
- What status codes mean.

Practice:

- Build `/api/health`.
- Open it in the browser.
- Fetch it from the frontend.

### Database Basics

Know:

- Table.
- Row.
- Column.
- Primary key.
- Foreign key.
- Unique constraint.
- Index.
- Migration.

Practice:

- Create one migration.
- Open Prisma Studio.
- Insert one test row.
- Query it through an API route.

### Validation

Know:

- Browser validation is for user experience.
- Server validation is for correctness and security.

Practice:

- Reject an empty note title.
- Reject rating value `6`.
- Reject unsupported file types.

### Authentication

Know:

- Authentication answers: who is this user?
- Authorization answers: what can this user do?

Practice:

- Use temporary `getCurrentUser()`.
- Later replace it with real session lookup.

### File Storage

Know:

- Database stores metadata.
- Object storage stores files.
- Signed URLs grant temporary access.

Practice:

- Generate a storage key server-side.
- Upload one file.
- Store only the storage key in the database.

## 10. Done Criteria

The backend is complete enough for the current app when all of these are true:

- Notes load from the database.
- Search and filters work through the API.
- Saved notes persist after reload.
- Ratings persist after reload.
- Download counts persist after reload.
- Upload metadata persists after reload.
- Real files upload to storage.
- API routes validate input.
- API routes use server-side current user identity.
- Users cannot modify another user's uploads.
- Production build passes.

Final verification commands:

```bash
pnpm lint
pnpm build
pnpm prisma validate
```

Manual verification:

1. Start the app.
2. Open `/app`.
3. Search for a note.
4. Save a note.
5. Reload.
6. Confirm saved state persisted.
7. Rate a note.
8. Reload.
9. Confirm rating persisted.
10. Upload a note.
11. Reload.
12. Confirm upload persisted.
13. Download a note.
14. Reload.
15. Confirm download count persisted.

## 11. How To Work With Me While You Build

Use one milestone per message.

Good requests:

- "Help me do Milestone 1. Explain each line before I write it."
- "Review my Prisma schema for Milestone 3."
- "I tried Milestone 7 and `/api/notes` returns 500. Debug with me."
- "Quiz me on the data model before I continue."
- "Explain why this route handler is wrong, but do not rewrite it for me."

When asking for help, include:

- The milestone number.
- The file you changed.
- The exact error message.
- What you expected to happen.
- What actually happened.

Do not skip milestones. Each milestone exists to isolate one kind of problem.
