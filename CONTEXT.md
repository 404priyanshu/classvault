# ClassVault

ClassVault is a study platform for Indian college students who need trusted notes, university-specific communities, live study spaces, and personalized study roadmaps.

## Language

**ClassVault**:
A study platform where Indian college students share rated notes, join public or university-specific communities, study together, and receive personalized study roadmaps.
_Avoid_: Class Vault, generic notes app

**Student**:
An Indian college student who uses ClassVault to find notes, participate in communities, study with others, or plan study work.
_Avoid_: learner, user, customer

**Verified University Member**:
A student with an active university membership.
_Avoid_: university admin, moderator, faculty

**Suspended Student**:
A student whose ClassVault access has been restricted by a platform administrator. Suspended students can only view their account profile and suspension notice, and cannot use participation features; suspension does not by itself remove or hide the student's existing notes, conversations, ratings, or shared roadmaps, and can be lifted by a platform administrator.
_Avoid_: banned user, limited member

**Deleted Student**:
A former student whose ClassVault account has been permanently deleted by a platform administrator. Existing notes, university conversations, replies, ratings, saved roadmaps, and shared roadmap links remain according to their normal scope rules with the student identity anonymized; preserved notes can still receive new ratings, but preserved university conversation posts cannot receive new replies.
_Avoid_: suspended student, erased author

**ClassVault Account**:
The student's primary account for signing in to ClassVault, created with a Gmail account or email and password.
_Avoid_: college account, university account

**Student Profile**:
The minimal public identity shown with student contributions when needed. Students can use and change pseudonymous display names, historical content shows the current display name unless the account is deleted, and account identity remains private but visible to platform administrators for support and moderation; ClassVault does not include follows, follower counts, or profile-centric discovery in the MVP.
_Avoid_: real-name profile, creator profile, social graph

**Notification**:
A persisted in-app message delivered to a student, with realtime delivery used for immediacy. In the MVP, students can view notification history, mark notifications as read, and clear them; clearing soft-hides notifications for the student rather than permanently deleting them, and ClassVault does not use push notifications, SMS, WhatsApp, or other notification channels.
_Avoid_: ephemeral toast, push notification, SMS alert, WhatsApp alert

**Transactional Email**:
An email required for account, verification, billing, or major moderation events. In the MVP, transactional emails include signup confirmation, auth verification, password reset, university verification outcome, Pro upgrade confirmation, payment failure, downgrade notice, suspension notice, and admin moderation action on user content; Resend is the preferred provider, with Supabase email allowed as a fallback.
_Avoid_: activity email, social digest

**Aggregate Analytics**:
Admin-only usage and operational metrics summarized across students or communities, such as note searches, note views and downloads, ratings submitted, roadmap generations, user counts, verification counts, uploads, study room activity, subscription metrics, moderation stats, and storage usage. ClassVault does not include per-user behavioral analytics in the MVP.
_Avoid_: student surveillance, behavioral tracking

**Free Tier**:
The default ClassVault plan with limited uploads and storage, basic study roadmaps using personal and public notes only, limited roadmap generations, and shorter study rooms. Verified university members on the free tier can still browse, download, and rate university notes and create or join university study rooms.
_Avoid_: trial, guest access

**Pro Tier**:
The paid ClassVault plan with expanded uploads and storage, unlimited study roadmap generations subject to fair-use limits, full community-powered study roadmaps including university notes, longer study room duration or higher room capacity, AI extras, priority features, and an ad-free experience. Pro controls new advanced study-roadmap generation using other students' university notes, not continued access to previously saved roadmaps or basic university note access.
_Avoid_: premium community, paid university access

**Pro Upgrade**:
The transition from free tier to pro tier after a paid subscription is confirmed. If payment succeeds but the upgrade is delayed, ClassVault retries the upgrade, shows a pending upgrade state, and allows platform administrators to manually grant Pro when needed.
_Avoid_: instant-only upgrade, automatic refund

**Past Due Subscription**:
A pro subscription whose renewal payment has failed. The student immediately follows free tier rules for new actions, receives billing notifications, and remains on free tier if provider retries fail and the subscription is cancelled; active study rooms keep the room entitlements they had at creation.
_Avoid_: grace period, suspended account

**Plan Limit**:
A configurable value that controls plan-based limits such as upload count, storage, roadmap generations, study room duration, and room capacity. Exact limit values are not hard-coded domain rules.
_Avoid_: hard-coded quota, fixed limit

**Over Free Limit**:
The state where a downgraded student keeps existing notes but exceeds free tier upload or storage limits. Recently deleted notes still count against limits during the recovery window, and the student cannot upload new notes until they delete enough content or upgrade again.
_Avoid_: forced deletion, hidden uploads

**Public Community**:
The general ClassVault space available to students regardless of college verification.
_Avoid_: global feed, open group

**University Community**:
A private ClassVault space scoped to a full university institution, not to a campus, department, or individual email domain.
_Avoid_: college group, department, campus, email domain

**University Membership**:
A student's current verified association with exactly one university community. University membership does not expire automatically in the MVP; when it is replaced or revoked, the student immediately loses access and management rights for the previous university community while their existing university-scoped content remains there unless separately moderated.
_Avoid_: affiliation list, memberships

**College Email Verification**:
The proof that links a student to a university community by confirming control of an allowed college email domain mapped to that institution. Each allowed domain maps to exactly one university institution; it is not the student's primary ClassVault account identity, and suffix-only domain checks are not sufficient.
_Avoid_: login, university account, suffix check, ambiguous domain, KYC, admission check

**University Access Request**:
A request from a student to add a missing university or email domain, including university name, official website, requested email domain, and the student's college email. Platform administrators review these requests before adding domains to the allowlist.
_Avoid_: self-created university, open signup

**Content Removal Request**:
A support or moderation request from a student asking platform administrators to remove old university-scoped content they can no longer manage directly.
_Avoid_: self-service deletion, community access request

**Note**:
An uploaded study file shared on ClassVault by a student for others to discover, view, download, rate, and use. In the MVP, a note is a PDF or image file; typed content, slides, editable documents, and comments are not notes, and the uploaded file itself is not replaced after upload.
_Avoid_: typed note, pasted content, comment thread, slide deck, document, resource

**Uploaded Note**:
A note uploaded by a student. The student can delete their uploaded public notes and current university notes, but cannot delete notes from a previous university community after switching university membership.
_Avoid_: owned note, my file

**Personal Note**:
A note personally uploaded by the student, whether it was uploaded to the public community or any university community. Personal notes remain eligible for the original uploader's study roadmaps even when the student no longer has normal community access to an old university-scoped upload.
_Avoid_: private note, local note

**Recently Deleted Note**:
A deleted uploaded note that is hidden from ClassVault views and unavailable for study roadmaps, but can be restored by the original uploader for 30 days before permanent removal. Recently deleted notes count against upload and storage limits during the recovery window; restoring a university note requires active membership in that university, restoring preserves ratings and rating history, and platform administrators can permanently delete it at any time.
_Avoid_: archived note, hidden note

**Admin-Hidden Note**:
A note temporarily hidden by a platform administrator for moderation review. Admin-hidden notes are unavailable for search, discovery, browsing, ratings, and study roadmaps; platform administrators can unhide them at any time, and they do not use the recently deleted recovery lifecycle.
_Avoid_: recently deleted note, user-deleted note

**Note Metadata**:
The descriptive information for a note. In the MVP, title, note scope, and at least one subject tag are required at upload; description and semester or year labels are optional, and note scope is not editable after upload.
_Avoid_: file content, note body, rigid semester model, scope edit

**Subject Tag**:
A globally shared free-form label students use to describe the subject or topic of notes and study rooms in the MVP. Subject tags use light normalization such as trimming and case-folding, but do not merge synonyms; they act as soft hints for study roadmaps, and search and filtering still respect the scope of the underlying content.
_Avoid_: course catalog, official course, synonym merge

**Note Scope**:
The audience where a note belongs: either the public community or one university community. A note does not span multiple scopes, there is no private personal note scope in the MVP, and anyone with access to the scope can view and download it.
_Avoid_: private note, visibility toggle, download toggle, sharing mode

**Note Rating**:
A student's current 1-5 star evaluation of a visible or downloadable note record. Rating requires current access to the note's scope; existing ratings remain and continue to count after access is lost, separate uploads of the same content can be rated independently, and there is no uploader reputation system in the MVP.
_Avoid_: upvote, like, score, reputation

**Weighted Note Rating**:
A note-ranking signal that considers average rating, rating count, and recency so notes with very few ratings do not outrank more trusted notes solely by raw average.
_Avoid_: raw average rating, popularity score

**Note Report**:
A policy or safety report submitted about a note for issues such as abuse, copyright violation, or spam. Note reports are reviewed by platform administrators with access to report details and history; low quality is handled through note ratings, not note reports.
_Avoid_: low-quality report, dislike

**Note Search**:
Search over notes using both note metadata and text extracted from uploaded files, while respecting note scope and note availability.
_Avoid_: metadata-only search, global search

**Limited Extraction Note**:
A note whose uploaded file was accepted but whose text extraction failed or produced limited usable text. Limited extraction status is visible to the uploader only; the note remains visible and usable, but has reduced search and study roadmap usefulness.
_Avoid_: failed upload, invalid note

**Public Note**:
A note shared inside the public community.
_Avoid_: global note, open note

**University Note**:
A note shared inside a university community. It remains in that university community even if the student who uploaded it later switches to a different university membership.
_Avoid_: private note, campus note

**Platform Administrator**:
A ClassVault operator with full moderation and management access. Platform administrators manage students, subscriptions, universities, email domain allowlists, platform settings, feature flags, moderation queues, and usage analytics; they can suspend students, manually change plan access, hide or permanently delete content, and restore only content that still exists in a restorable state, but cannot impersonate student accounts in the MVP.
_Avoid_: university admin, university moderator, faculty

**Accessible Notes**:
The notes a student is allowed to use or discover. Students can access public notes and notes from their current university community when they have a university membership; their own old uploads outside current access are not accessible notes.
_Avoid_: all notes, global corpus

**Plan-Eligible Notes**:
The notes ClassVault can use for a student's study roadmaps based on their plan. Free tier roadmaps use the student's personal notes plus public notes; Pro tier roadmaps can also use other accessible university notes.
_Avoid_: accessible notes, all notes, manual source selection

**University Conversation**:
A text-based discussion thread or post that lives exclusively inside a verified university community for quick questions, short tips, summaries, and other lightweight academic discussion that does not qualify as a note. Students can edit their own posts and replies within 30 minutes of creation, can permanently delete them while they are active verified members of that university, and deleting a post also deletes its replies; deleted-student posts remain visible but closed to new replies.
_Avoid_: note, public post, global forum, chat

**Conversation Report**:
A policy or safety report submitted about a university conversation post or reply for issues such as abuse, spam, or inappropriate content. Conversation reports are reviewed by platform administrators in the same moderation queue as note reports.
_Avoid_: note report, low-quality report

**Study Room**:
A temporary live shared space where students study together with video, audio, a synced timer, simple text chat, and a participant list. Study rooms can be public or university-scoped, may use optional subject labels for filtering, are discovered through scoped room lists, shareable links, and invites, and links or invites never bypass the room's scope. Study rooms can continue after the original host leaves, end only when the last participant leaves or the duration limit is reached, do not feed study roadmaps or note recommendations, and do not include shared resources such as whiteboards or shared documents in the MVP.
_Avoid_: meeting, session, whiteboard, shared document

**Room Capacity**:
The configurable maximum number of students who can join a study room, based on room scope and the host's plan.
_Avoid_: unlimited room, audience size

**Pro Study Room**:
A study room created by a pro student with longer duration, higher participant limits, and enhanced host moderation tools. Pro study room benefits are fixed at room creation, can apply to public or university-scoped rooms, and free students can join when they satisfy the room's normal scope rules.
_Avoid_: recorded room, paid-only university room

**Pro Host Controls**:
Enhanced study room controls available in pro-hosted rooms: room-wide audio and chat mute, removing multiple participants at once, locking the room to prevent new joins, and assigning or removing co-hosts with kick and mute rights for that room. Co-hosts cannot assign other co-hosts or remove the original room host; if the original host leaves, the first co-host becomes the new host, and otherwise the room continues without active host controls.
_Avoid_: recording, permanent moderator

**Room Host**:
The student who creates a study room. In the MVP, the room host can kick participants or mute their audio and chat; mutes last until the host manually unmutes the participant or the room ends, and a kicked participant cannot rejoin that room for the rest of its lifetime.
_Avoid_: moderator, admin

**Participant Report**:
A report submitted by a study room participant about another participant for platform administrator review. Participant reports retain reporter and reported student identities, room reference, report reason, optional description, and timestamp; chat message content, full room chat, timer, and video data are not retained, and students cannot report the study room itself in the MVP.
_Avoid_: room report, block, rating

**Room Moderation Event**:
A persisted safety record from a study room, such as a kick, mute, or participant report. Room moderation events remain available for audit and platform administrator review after the study room itself ends.
_Avoid_: chat history, recording

**Study Mode**:
The student's selected roadmap style: in-depth study or exam-style revision.
_Avoid_: difficulty, category

**Roadmap Source Link**:
A reference from a saved study roadmap to a source note used during generation. If the note is inaccessible through normal note access, including old university uploads used as personal roadmap context, the saved reference remains visible but opens to a clear unavailable message instead of exposing the note.
_Avoid_: copied note, embedded source

**Roadmap Section Source**:
The note references recorded for a specific study roadmap phase or major section. In shared roadmaps, a section is hidden or replaced with an access-restriction placeholder if any of its source notes are inaccessible to the viewer.
_Avoid_: untracked source, weak attribution

**Note Chunk**:
An internal extracted segment of a note used to support study roadmap generation. Students see the originating notes as source notes rather than seeing note chunks directly; note chunks are excluded when their note is recently deleted or admin-hidden, and are purged when the note is permanently deleted.
_Avoid_: source note, conversation chunk

**Shared Study Roadmap**:
A read-only saved study roadmap available through an owner-enabled, revocable shareable link for both free and pro students. Saved roadmaps are private by default, and share links for previously generated pro roadmaps can remain active after downgrade; public-note content can be viewed by anyone with the link, while university-derived sources and sections remain access-gated by university membership. When multiple university communities are represented, only the original owner can view the full roadmap and shared viewers see a partial roadmap with inaccessible content hidden or replaced by an access-restriction placeholder; viewers cannot copy the roadmap, and progress state remains private to the original owner.
_Avoid_: public roadmap, collaborative roadmap

**Study Roadmap**:
A saved, personalized, structured snapshot generated from a student-provided topic and study mode using the student's plan-eligible notes automatically. A study roadmap remains accessible to its owner after plan downgrades, infers structure from notes, topic, and mode rather than a standalone syllabus model, includes a phased timeline, topic checklist, estimated tasks, source-note links, and progress checkboxes, does not update automatically when source notes change or are deleted, and can be permanently deleted by the student.
_Avoid_: generic plan, plain checklist, timetable, syllabus model

**Roadmap Generation Quota**:
The plan-based limit on creating new study roadmaps. Free students cannot generate new roadmaps after reaching their quota until it resets or they upgrade; pro students have unlimited generations subject to fair-use limits, and existing roadmaps remain usable.
_Avoid_: roadmap access limit, deletion trigger
