export default function NotesLoading() {
  return (
    <div
      aria-label="Loading notes"
      className="mx-auto max-w-[1320px] animate-pulse space-y-7"
      role="status"
    >
      <div className="border-b border-[#cfc4ae] pb-6">
        <div className="h-12 w-64 bg-[#17453a]/12" />
        <div className="mt-3 h-4 w-full max-w-lg bg-[#171512]/10" />
      </div>
      <div className="h-40 border border-[#cfc4ae] bg-[#fffdf6]" />
      <div>
        <div className="h-8 w-48 bg-[#171512]/10" />
        <div className="mt-4 overflow-hidden border border-[#cfc4ae] bg-[#fffdf6]">
          {[0, 1, 2, 3].map((item) => (
            <div
              className="grid min-h-36 grid-cols-[104px_1fr] gap-5 border-b border-[#d9cfbc] p-5 last:border-b-0"
              key={item}
            >
              <div className="bg-[#17453a]/10" />
              <div className="space-y-3 py-2">
                <div className="h-3 w-32 bg-[#17453a]/15" />
                <div className="h-6 w-3/5 bg-[#171512]/12" />
                <div className="h-3 w-4/5 bg-[#171512]/8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
