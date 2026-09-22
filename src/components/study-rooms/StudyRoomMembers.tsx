import { Crown, MicOff, ShieldCheck, UserRound } from 'lucide-react'
import { setStudyRoomMemberRoleAction } from '@/app/dashboard/study-rooms/actions'
import { ProfileAvatar } from '@/components/settings/ProfileAvatar'
import type { StudyRoomSnapshot } from '@/lib/study-rooms/types'
import { StudyRoomMemberActions } from './StudyRoomMemberActions'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

function roleLabel(role: 'host' | 'cohost' | 'member') {
  if (role === 'host') return 'Host'
  if (role === 'cohost') return 'Co-host'
  return 'Member'
}

export function StudyRoomMembers({
  currentUserId,
  members,
  messages,
  mutedUserIds,
  roomId,
  viewerRole,
}: {
  currentUserId: string
  members: StudyRoomSnapshot['members']
  messages: StudyRoomSnapshot['messages']
  mutedUserIds: string[]
  roomId: string
  viewerRole: StudyRoomSnapshot['viewerRole']
}) {
  const canControl = viewerRole === 'host' || viewerRole === 'cohost'
  const muted = new Set(mutedUserIds)

  return (
    <div className="divide-y divide-club-line">
      {members.map((member) => {
        const isSelf = member.userId === currentUserId
        const isMuted = muted.has(member.userId)
        // The database refuses a control aimed at a host or co-host, so the
        // button is not offered either: a co-host who cannot remove the host
        // should not be handed a button that fails.
        const showControls = canControl && !isSelf && member.role === 'member'

        return (
          <div
            className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0"
            key={member.userId}
          >
            <ProfileAvatar
              avatarUrl={member.avatarUrl}
              className="h-10 w-10 rounded-lg text-xs"
              displayName={member.displayName}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {member.displayName}
                {isSelf ? (
                  <span className="ml-1 font-semibold text-club-muted">(you)</span>
                ) : null}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-club-muted">
                <span className="inline-flex items-center gap-1.5">
                  {member.role === 'host' ? (
                    <Crown aria-hidden className="h-3.5 w-3.5 text-[#b56d00]" />
                  ) : member.role === 'cohost' ? (
                    <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-club-purple" />
                  ) : (
                    <UserRound aria-hidden className="h-3.5 w-3.5" />
                  )}
                  {roleLabel(member.role)}
                </span>
                {isMuted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff2ef] px-2 py-0.5 font-black text-[#9a3328]">
                    <MicOff aria-hidden className="h-3 w-3" />
                    Muted
                  </span>
                ) : null}
              </p>
            </div>

            {viewerRole === 'host' && !isSelf && member.role !== 'host' ? (
              <form action={setStudyRoomMemberRoleAction}>
                <input name="roomId" type="hidden" value={roomId} />
                <input name="userId" type="hidden" value={member.userId} />
                <input
                  name="role"
                  type="hidden"
                  value={member.role === 'cohost' ? 'member' : 'cohost'}
                />
                <StudyRoomSubmitButton
                  className="min-h-8 bg-transparent px-2.5 text-xs text-club-purple shadow-none hover:bg-club-mint"
                  pendingLabel="Saving…"
                >
                  {member.role === 'cohost' ? 'Remove co-host' : 'Make co-host'}
                </StudyRoomSubmitButton>
              </form>
            ) : null}

            {isSelf ? null : (
              <StudyRoomMemberActions
                displayName={member.displayName}
                isMuted={isMuted}
                messages={messages.filter(
                  (message) => message.authorId === member.userId,
                )}
                roomId={roomId}
                showControls={showControls}
                userId={member.userId}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
