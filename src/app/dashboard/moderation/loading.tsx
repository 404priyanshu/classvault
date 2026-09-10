import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function ModerationLoading() {
  return <LoadingSkeleton label="Loading moderation queue" rows={4} shape="list" />
}
