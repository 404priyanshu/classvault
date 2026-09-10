import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function DashboardLoading() {
  return <LoadingSkeleton label="Loading your dashboard" rows={3} shape="grid" />
}
