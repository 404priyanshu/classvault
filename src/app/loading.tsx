import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-club-bg px-6 text-club-ink">
      <div className="relative flex flex-col items-center rounded-[32px] bg-club-lavender p-10 text-center">
        <Spinner
          className="size-28 text-club-purple"
          label="Loading ClassVault"
          size={112}
        />
        <p className="font-display mt-5 text-2xl font-black">
          Opening your vault…
        </p>
        <p className="mt-2 text-sm text-club-muted">
          Sharpening pencils and finding your notes.
        </p>
      </div>
    </main>
  )
}
