import pattern from '@/assets/pattern.webp'

export default function UniversityTicker() {
  return (
    <section
      className="border-b-[1.5px] border-[#171512]/20 bg-[#efe8d8] py-10"
      style={{ backgroundImage: `url(${pattern.src})`, backgroundSize: '768px' }}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 text-center">
        <p className="font-display text-2xl font-black leading-tight text-[#171512] md:text-3xl">
          Opening at{' '}
          <span className="relative whitespace-nowrap">
            <span className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-[#f0a202]/55" />
            <span className="relative">Bennett University</span>
          </span>{' '}
          first.
        </p>
        <p className="max-w-xl text-sm font-medium leading-relaxed text-[#171512]/70">
          One campus at a time, on purpose. Ratings only mean something once
          enough classmates in the same subject have left one, and that happens
          faster on one campus than on fourteen. Another university opens when
          its first cohort is ready.
        </p>
        <p className="font-hand text-lg text-[#171512]/60">
          not your campus yet? tell us and you&apos;ll be next in line ✎
        </p>
      </div>
    </section>
  )
}
