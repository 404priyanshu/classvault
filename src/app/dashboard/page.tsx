import { redirect } from 'next/navigation'
import { AuthMessage } from '@/components/auth/AuthMessage'
import {
  DashboardHome,
  type DashboardNote,
} from '@/components/dashboard/DashboardHome'
import type { OwnedNote } from '@/lib/notes/vault'
import {
  pickRoadmapToContinue,
  type OwnedRoadmapSummary,
} from '@/lib/roadmaps/foundation'
import type { StudyRoomListItem } from '@/lib/study-rooms/types'
import { getRequestClaims } from '@/lib/supabase/claims'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type DashboardPageProps = {
  searchParams: Promise<{ status?: string }>
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { status } = await searchParams
  const supabase = await createClient()
  const claims = await getRequestClaims()

  if (!claims) {
    redirect('/auth/sign-in?next=/dashboard')
  }

  // One trip instead of two. The feed and rooms do not depend on the profile,
  // so chaining the blocks only bought a second Mumbai round trip before the
  // page could start rendering. The onboarding redirect below still guards the
  // screen; it just no longer gates the queries that never needed it.
  //
  // The student's own notes and roadmaps ride along rather than adding a hop.
  // They give the greeting its counts, tick the setup checklist, and fill the
  // rail with the student's own work. A pilot student owns a handful of each,
  // so the full lists cost about what the head-only counts they replaced did.
  const [
    profileResult,
    membershipResult,
    { data: recentNotes },
    { data: roomRows },
    { data: ownedNoteRows },
    { data: roadmapRows },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, onboarding_completed_at')
      .eq('id', claims.sub)
      .maybeSingle(),
    supabase
      .from('university_memberships')
      .select('status')
      .eq('user_id', claims.sub)
      .maybeSingle(),
    supabase
      .from('notes')
      .select('id, title, note_type, published_at, visibility, subjects(code, name)')
      .eq('publication_status', 'published')
      .eq('moderation_status', 'clear')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(4),
    supabase.rpc('list_study_rooms'),
    supabase.rpc('list_owned_notes', { p_include_deleted: false }),
    supabase.rpc('list_owned_roadmaps'),
  ])

  const profile = profileResult.data

  if (!profile?.onboarding_completed_at) {
    redirect('/onboarding')
  }

  const email =
    typeof claims.email === 'string' && claims.email ? claims.email : null
  const phone =
    typeof claims.phone === 'string' && claims.phone ? claims.phone : null
  const displayName =
    profile.display_name || (email ? email.split('@')[0] : phone || 'Student')
  const rooms = (roomRows || []) as StudyRoomListItem[]
  const ownedNotes = (ownedNoteRows || []) as OwnedNote[]
  const roadmaps = (roadmapRows || []) as OwnedRoadmapSummary[]

  return (
    <>
      <AuthMessage status={status} />
      <DashboardHome
        firstName={displayName.split(/\s+/)[0]}
        isVerified={membershipResult.data?.status === 'verified'}
        liveRoomCount={rooms.length}
        notes={(recentNotes || []) as DashboardNote[]}
        ownedNoteCount={ownedNotes.length}
        recentUploads={ownedNotes.slice(0, 3)}
        roadmapCount={roadmaps.length}
        roadmapToContinue={pickRoadmapToContinue(roadmaps)}
        suggestedRoom={rooms[0] || null}
      />
    </>
  )
}
