import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function VaultLoading() {
  return <LoadingSkeleton label="Loading your vault" rows={4} shape="list" />
}
