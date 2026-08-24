import { Crown, ShieldCheck, UserRound } from 'lucide-react'
import { setStudyRoomMemberRoleAction } from '@/app/dashboard/study-rooms/actions'
import { ProfileAvatar } from '@/components/settings/ProfileAvatar'
import type { StudyRoomSnapshot } from '@/lib/study-rooms/types'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

function roleLabel(role: 'host' | 'cohost' | 'member') {
  if (role === 'host') return 'Host'
  if (role === 'cohost') return 'Co-host'
  return 'Member'
}

export function StudyRoomMembers({
  currentUserId,
  members,
  roomId,
  viewerRole,
}: {
  currentUserId: string
  members: StudyRoomSnapshot['members']
  roomId: string
  viewerRole: StudyRoomSnapshot['viewerRole']
}) {
  return (
    <div className="divide-y divide-[#e2dacb]">
      {members.map((member) => (
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
              {member.userId === currentUserId ? (
                <span className="ml-1 font-semibold text-[#171512]/45">(you)</span>
              ) : null}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#171512]/50">
              {member.role === 'host' ? (
                <Crown aria-hidden className="h-3.5 w-3.5 text-[#b56d00]" />
              ) : member.role === 'cohost' ? (
                <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-[#17453a]" />
              ) : (
                <UserRound aria-hidden className="h-3.5 w-3.5" />
              )}
              {roleLabel(member.role)}
            </p>
          </div>

          {viewerRole === 'host' &&
          member.userId !== currentUserId &&
          member.role !== 'host' ? (
            <form action={setStudyRoomMemberRoleAction}>
              <input name="roomId" type="hidden" value={roomId} />
              <input name="userId" type="hidden" value={member.userId} />
              <input
                name="role"
                type="hidden"
                value={member.role === 'cohost' ? 'member' : 'cohost'}
              />
              <StudyRoomSubmitButton
                className="min-h-8 bg-transparent px-2.5 text-xs text-[#17453a] shadow-none hover:bg-[#eef4ed]"
                pendingLabel="Saving…"
              >
                {member.role === 'cohost' ? 'Remove co-host' : 'Make co-host'}
              </StudyRoomSubmitButton>
            </form>
          ) : null}
        </div>
      ))}
    </div>
  )
}
