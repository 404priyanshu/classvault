export default function NotesLoading() {
  return (
    <div
      aria-label="Loading notes"
      className="mx-auto max-w-[1320px] animate-pulse space-y-7"
      role="status"
    >
      <div className="border-b border-club-line pb-6">
        <div className="h-12 w-64 bg-club-purple/12" />
        <div className="mt-3 h-4 w-full max-w-lg bg-club-ink/10" />
      </div>
      <div className="h-40 border border-club-line bg-club-paper" />
      <div>
        <div className="h-8 w-48 bg-club-ink/10" />
        <div className="mt-4 overflow-hidden border border-club-line bg-club-paper">
          {[0, 1, 2, 3].map((item) => (
            <div
              className="grid min-h-36 grid-cols-[104px_1fr] gap-5 border-b border-club-line p-5 last:border-b-0"
              key={item}
            >
              <div className="bg-club-purple/10" />
              <div className="space-y-3 py-2">
                <div className="h-3 w-32 bg-club-purple/15" />
                <div className="h-6 w-3/5 bg-club-ink/12" />
                <div className="h-3 w-4/5 bg-club-ink/8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
