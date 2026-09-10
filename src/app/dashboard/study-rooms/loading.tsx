import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function StudyRoomsLoading() {
  return <LoadingSkeleton label="Loading study rooms" rows={3} shape="grid" />
}
