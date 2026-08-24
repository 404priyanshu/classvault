# ClassVault Study Rooms — Product, Data, and Permissions

Status: implemented foundation, verified against hosted development on
2026-08-24.

This document is the canonical contract for the authenticated study-room
slice. The landing-page `StudyRoom` section remains a visual simulation; the
real product lives under `/dashboard/study-rooms`.

## Product scope

The first production slice provides temporary rooms for focused study:

- public rooms available to any onboarding-complete student;
- university rooms available only to currently verified members of the same
  university;
- a synchronized focus/break timer;
- host, co-host, and member roles;
- temporary room chat;
- live lobby, member, timer, and chat refresh through Supabase Realtime; and
- automatic expiry and server-only cleanup.

Video, audio, screen sharing, recording, file sharing, reporting, kicking,
muting, billing, and durable chat history are outside this slice.

## Routes

| Route | Contract |
| --- | --- |
| `/dashboard/study-rooms` | Protected RLS-filtered lobby, joined-room rail, filters, join controls, and room creation. |
| `/dashboard/study-rooms/[roomId]` | Protected member-only room snapshot with timer, member roles, temporary chat, and leave/end controls. |
| `/api/cron/purge-study-rooms` | Server-only GET/POST cleanup route authenticated by `CRON_SECRET`. |

## Data model

### `study_room_plan_limits`

Server-owned configuration for plan limits. Clients cannot read or choose a
plan directly. Current snapshots are:

| Plan | Capacity | Duration | Max focus | Max break |
| --- | ---: | ---: | ---: | ---: |
| Free | 8 | 120 minutes | 60 minutes | 20 minutes |
| Pro | 24 | 240 minutes | 120 minutes | 30 minutes |

`current_study_room_plan()` currently resolves every eligible student to
`free`. The boundary exists for a future billing/entitlement integration; the
browser cannot promote itself to Pro.

### `study_rooms`

Stores the temporary room, access scope, capacity/duration snapshots, and the
durable timer state. Important fields include:

- owner-derived `created_by`;
- `visibility` (`public` or `university`);
- a required `university_id` only for university rooms;
- snapshotted plan, capacity, focus, break, and expiry values;
- timer phase, status, anchor, remaining seconds, revision, and cycle count;
- `ends_at`, after which the room is unavailable.

Plan changes do not alter an already-created room.

### `study_room_members`

Contains one membership per room/user with `host`, `cohost`, or `member` role.
It stores a safe display-name and avatar snapshot for room rendering so the UI
does not need access to other students' private profile rows. A partial unique
index permits only one host per room.

### `study_room_messages`

Contains room-scoped chat with a safe author-label snapshot and a message body
limited to 1,000 characters. Messages cascade when the room is deleted. This
is temporary coordination data, not a persistent messaging product.

## Authorization matrix

| Operation | Anonymous | Eligible student | Same-campus verified student | Room member | Host/co-host | Service role |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Discover public room | No | Yes | Yes | Yes | Yes | Yes |
| Discover university room | No | No, unless same campus | Yes | Yes while access remains valid | Yes | Yes |
| Create public room | No | Yes | Yes | Yes | Yes | Yes |
| Create university room | No | No | Yes, for own verified campus | Yes | Yes | Yes |
| Join accessible room | No | Yes | Yes | Already joined | Already joined | Yes |
| Read member list/chat | No | No | No | Yes | Yes | Yes |
| Send chat | No | No | No | Yes | Yes | Yes |
| Control timer | No | No | No | No | Yes | Yes |
| Assign/remove co-host | No | No | No | No | Host only | Yes |
| End room | No | No | No | No | Host only | Yes |
| Purge expired rooms | No | No | No | No | No | Yes |

An eligible student must be authenticated and have completed onboarding.
University access additionally requires a current `verified` membership for
the room's university. Direct-ID access is rechecked in the database.

## Mutation boundary

Authenticated clients receive read grants filtered by forced RLS, but no
direct insert, update, or delete grants on room tables. All writes go through
validated `SECURITY DEFINER` RPCs:

- `create_study_room(...)`
- `join_study_room(uuid)`
- `leave_study_room(uuid)`
- `set_study_room_member_role(uuid, uuid, text)`
- `update_study_room_timer(uuid, text, bigint)`
- `send_study_room_message(uuid, text)`
- `end_study_room(uuid)`

The server derives the caller from `auth.uid()`, rechecks eligibility and room
access, and owns plan/capacity/duration decisions. `purge_expired_study_rooms()`
is executable only by `service_role`.

## Room lifecycle

1. An eligible student creates a room and atomically becomes its host.
2. Eligible students may join until the snapshotted capacity is reached.
3. The host can appoint members as co-hosts and revoke that role.
4. When the host leaves, the earliest-joined co-host is promoted.
5. If no co-host exists, the room remains usable without active host controls.
6. When the last member leaves, the room and its messages are deleted.
7. A host may end the room explicitly, deleting all room data.
8. Expired rooms become unavailable immediately and are removed by the
   scheduled purge route.

## Timer concurrency

The room stores a server timestamp anchor and calculates the displayed
remaining time from PostgreSQL `now()`. A monotonically increasing revision is
returned with each snapshot. Every start, pause, reset, or skip request must
include the expected revision; stale requests fail instead of overwriting a
newer control action.

The browser may animate between server snapshots, but the database state is
authoritative. Realtime room updates cause clients to refresh the protected
server snapshot.

## Realtime boundary

`study_rooms`, `study_room_members`, and `study_room_messages` are in the
Supabase Realtime publication. Realtime does not bypass RLS: subscriptions use
the authenticated session and receive only rows the viewer may read.

Membership changes touch the parent room's `updated_at` value. This gives lobby
subscribers a safe room-row signal to refresh aggregate member counts without
exposing identities to non-members.

Realtime is a refresh signal, not the authorization or mutation layer. Server
components and database RPCs still revalidate every read and write.

## Scheduled cleanup

`/api/cron/purge-study-rooms` accepts GET or POST with:

```text
Authorization: Bearer <CRON_SECRET>
```

The route requires both `CRON_SECRET` and the server-only
`SUPABASE_SERVICE_ROLE_KEY`. It calls the narrow purge RPC; it does not expose
the service-role credential to the browser. Schedule it frequently enough that
expired metadata does not accumulate. Access checks already reject expired
rooms before physical deletion.

## Verification baseline

`supabase/tests/study_rooms.sql` contains 57 transactional pgTAP assertions for:

- schema, forced RLS, and least-privilege grants;
- onboarding and campus eligibility;
- public and university discovery/direct-ID isolation;
- immediate read/chat/control revocation when campus access is lost;
- owner-derived creation and plan snapshots;
- capacity, joining, membership privacy, and chat scope;
- host/co-host controls and deterministic promotion;
- revision-checked timer concurrency;
- hostless continuation and last-member cleanup;
- service-only expiry purge; and
- Realtime publication.

Application tests cover server-action validation/error mapping and protected
route/cron boundaries. The verified repository baseline is 90 Vitest tests,
16 Playwright smoke tests, and 57 study-room pgTAP assertions.

## Deferred decisions

- Billing and the source of real Pro entitlements.
- Video/audio/WebRTC provider and network topology.
- Kick, mute, report, block, and moderation audit workflows.
- Abuse limits for room creation and chat volume.
- Durable or exportable chat, if the product ever requires it.
- Push notifications, invitations, recording, and analytics.

Any future media or moderation work must preserve the database-owned room and
campus authorization boundary rather than trusting client membership state.
