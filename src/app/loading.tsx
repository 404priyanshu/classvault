import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <main className="paper-grain relative grid min-h-screen place-items-center overflow-hidden bg-[#f6f1e5] px-6 text-[#171512]">
      <div className="bg-dotgrid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative flex flex-col items-center text-center">
        <Spinner
          className="size-28 text-[#17453a]"
          label="Loading ClassVault"
          size={112}
        />
        <p className="font-display mt-5 text-2xl font-black">
          Opening your vault…
        </p>
        <p className="mt-2 text-sm text-[#171512]/55">
          Sharpening pencils and finding your notes.
        </p>
      </div>
    </main>
  )
}
