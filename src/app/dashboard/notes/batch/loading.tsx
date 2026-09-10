import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function BatchNoteLoading() {
  return <LoadingSkeleton label="Loading the batch uploader" rows={4} shape="panel" />
}
