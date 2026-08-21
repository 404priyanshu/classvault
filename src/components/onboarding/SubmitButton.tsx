import { ArrowRight } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { Spinner } from '@/components/ui/spinner'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className="flex min-h-12 items-center justify-center gap-2 border-[1.5px] border-[#171512] bg-[#17453a] px-6 py-3 text-sm font-black text-[#f6f1e5] shadow-[4px_4px_0_#171512] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#171512] disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <Spinner className="size-6" decorative size={24} />
      ) : null}
      {pending ? 'Setting up your vault…' : 'Finish setup'}
      {pending ? null : <ArrowRight className="h-4 w-4" />}
    </button>
  )
}
