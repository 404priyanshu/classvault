import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function NewNoteLoading() {
  return <LoadingSkeleton label="Loading the uploader" rows={4} shape="panel" />
}
