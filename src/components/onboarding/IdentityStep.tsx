import { CalendarDays, ChevronDown, GraduationCap } from 'lucide-react'
import { COURSE_OPTIONS } from './constants'

export function IdentityStep({
  course,
  displayName,
  graduationYear,
  onCourseChange,
  onDisplayNameChange,
  onGraduationYearChange,
}: {
  course: string
  displayName: string
  graduationYear: string
  onCourseChange: (value: string) => void
  onDisplayNameChange: (value: string) => void
  onGraduationYearChange: (value: string) => void
}) {
  return (
    <div>
      <h2 className="font-display max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl">
        First, tell us who&apos;s studying.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
        These details shape your profile and help us organize the
        right academic experience around you.
      </p>

      <div className="mt-9 grid gap-6 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-black">Your name</span>
          <span className="mt-1 block text-xs text-[#171512]/50">
            Use the name classmates should see.
          </span>
          <input
            autoComplete="name"
            className="mt-2 h-[52px] w-full border-[1.5px] border-[#171512] bg-[#fffdf6] px-4 text-base font-semibold outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
            maxLength={80}
            minLength={2}
            onChange={(event) => {
              onDisplayNameChange(event.target.value)
            }}
            placeholder="Akruti Tiwari"
            required
            value={displayName}
          />
        </label>

        <label className="block">
          <span className="text-sm font-black">Course or degree</span>
          <span className="mt-1 block text-xs text-[#171512]/50">
            Your current academic program.
          </span>
          <div className="relative mt-2">
            <GraduationCap className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#17453a]" />
            <select
              className="h-[52px] w-full appearance-none border-[1.5px] border-[#171512] bg-[#fffdf6] pl-11 pr-11 text-base font-semibold outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
              onChange={(event) => {
                onCourseChange(event.target.value)
              }}
              required
              value={course}
            >
              <option disabled value="">
                Select your degree
              </option>
              {COURSE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#17453a]" />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-black">Graduation year</span>
          <span className="mt-1 block text-xs text-[#171512]/50">
            Your expected year of graduation.
          </span>
          <div className="relative mt-2">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#17453a]" />
            <input
              className="h-[52px] w-full border-[1.5px] border-[#171512] bg-[#fffdf6] pl-11 pr-4 text-base font-semibold outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
              inputMode="numeric"
              max={new Date().getFullYear() + 12}
              min={new Date().getFullYear()}
              onChange={(event) => {
                onGraduationYearChange(event.target.value)
              }}
              required
              type="number"
              value={graduationYear}
            />
          </div>
        </label>
      </div>
    </div>
  )
}
