import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function NoteLoading() {
  return <LoadingSkeleton label="Loading note" rows={3} shape="panel" />
}
