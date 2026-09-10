import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function RoadmapsLoading() {
  return <LoadingSkeleton label="Loading study roadmaps" rows={3} shape="grid" />
}
