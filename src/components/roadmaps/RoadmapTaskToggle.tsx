'use client'

import { useFormStatus } from 'react-dom'
import { Check, Circle } from 'lucide-react'
import { setRoadmapTaskProgressAction } from '@/app/dashboard/roadmaps/actions'
import { Spinner } from '@/components/ui/spinner'

function TaskButton({ completed }: { completed: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      aria-label={completed ? 'Mark task as not done' : 'Mark task as done'}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#171512] bg-white transition-colors hover:bg-[#fff2bd] disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <Spinner decorative size={16} />
      ) : completed ? (
        <Check aria-hidden className="h-4 w-4 text-[#17453a]" strokeWidth={3} />
      ) : (
        <Circle aria-hidden className="h-3.5 w-3.5 text-[#171512]/35" />
      )}
    </button>
  )
}

export function RoadmapTaskToggle({
  completed,
  roadmapId,
  taskId,
}: {
  completed: boolean
  roadmapId: string
  taskId: number
}) {
  return (
    <form action={setRoadmapTaskProgressAction}>
      <input name="completed" type="hidden" value={completed ? 'false' : 'true'} />
      <input name="roadmapId" type="hidden" value={roadmapId} />
      <input name="taskId" type="hidden" value={taskId} />
      <TaskButton completed={completed} />
    </form>
  )
}
