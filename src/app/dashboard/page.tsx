import { redirect } from 'next/navigation'
import { AuthMessage } from '@/components/auth/AuthMessage'
import {
  DashboardHome,
  type DashboardNote,
} from '@/components/dashboard/DashboardHome'
import type { StudyRoomListItem } from '@/lib/study-rooms/types'
import { getRequestClaims } from '@/lib/supabase/claims'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type DashboardPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { q = '', status } = await searchParams
  const query = q.trim().slice(0, 80)
  const supabase = await createClient()
  const claims = await getRequestClaims()

  if (!claims) {
    redirect('/auth/sign-in?next=/dashboard')
  }

  let notesQuery = supabase
    .from('notes')
    .select('id, title, note_type, published_at, visibility, subjects(code, name)')
    .eq('publication_status', 'published')
    .eq('moderation_status', 'clear')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(4)

  if (query) {
    notesQuery = notesQuery.ilike('title', `%${query}%`)
  }

  // One trip instead of two. The feed and rooms do not depend on the profile,
  // so chaining the blocks only bought a second Mumbai round trip before the
  // page could start rendering. The onboarding redirect below still guards the
  // screen; it just no longer gates the queries that never needed it.
  //
  // The two counts ride along rather than adding a hop: they are head-only, and
  // the greeting strip is meaningless without them.
  const [
    profileResult,
    membershipResult,
    { data: recentNotes },
    { data: roomRows },
    ownedNotesResult,
    roadmapsResult,
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
    notesQuery,
    supabase.rpc('list_study_rooms'),
    supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', claims.sub)
      .is('deleted_at', null),
    supabase
      .from('study_roadmaps')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', claims.sub),
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

  return (
    <>
      <AuthMessage status={status} />
      <DashboardHome
        firstName={displayName.split(/\s+/)[0]}
        isVerified={membershipResult.data?.status === 'verified'}
        liveRoomCount={rooms.length}
        notes={(recentNotes || []) as DashboardNote[]}
        ownedNoteCount={ownedNotesResult.count || 0}
        query={query}
        roadmapCount={roadmapsResult.count || 0}
        suggestedRoom={rooms[0] || null}
      />
    </>
  )
}
