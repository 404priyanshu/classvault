import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function SettingsLoading() {
  return <LoadingSkeleton label="Loading settings" rows={4} shape="panel" />
}
