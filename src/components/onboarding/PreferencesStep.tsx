import { Check, UsersRound } from 'lucide-react'
import { GOALS, STUDY_PREFERENCES } from './constants'

export function PreferencesStep({
  onGoalChange,
  onPreferenceChange,
  primaryGoal,
  studyPreference,
}: {
  onGoalChange: (value: string) => void
  onPreferenceChange: (value: string) => void
  primaryGoal: string
  studyPreference: string
}) {
  return (
    <div>
      <h2 className="font-display max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl">
        What should this semester feel like?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
        Pick the goal and study rhythm that fit you now. You can
        change both later.
      </p>

      <fieldset className="mt-8">
        <legend className="text-sm font-black">
          Your main goal
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {GOALS.map((goal) => {
            const Icon = goal.icon
            const selected = primaryGoal === goal.value

            return (
              <button
                aria-pressed={selected}
                className={`flex items-start gap-3 border-[1.5px] p-4 text-left transition-all ${
                  selected
                    ? 'border-[#171512] bg-[#f0a202]/25 shadow-[3px_3px_0_#171512]'
                    : 'border-[#171512]/35 bg-[#fffdf6] hover:border-[#171512]'
                }`}
                key={goal.value}
                onClick={() => onGoalChange(goal.value)}
                type="button"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#17453a]" />
                <span>
                  <span className="block text-sm font-black">
                    {goal.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#171512]/55">
                    {goal.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="text-sm font-black">
          You study best with
        </legend>
        <div className="mt-3 grid gap-2">
          {STUDY_PREFERENCES.map((preference) => {
            const selected =
              studyPreference === preference.value

            return (
              <button
                aria-pressed={selected}
                className={`flex items-center gap-3 border-[1.5px] px-4 py-3 text-left ${
                  selected
                    ? 'border-[#17453a] bg-[#17453a] text-[#f6f1e5]'
                    : 'border-[#171512]/30 bg-[#fffdf6] hover:border-[#171512]'
                }`}
                key={preference.value}
                onClick={() => onPreferenceChange(preference.value)}
                type="button"
              >
                <UsersRound className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-black">
                    {preference.label}
                  </span>
                  <span
                    className={`ml-2 text-xs ${
                      selected
                        ? 'text-[#f6f1e5]/65'
                        : 'text-[#171512]/50'
                    }`}
                  >
                    {preference.description}
                  </span>
                </span>
                {selected ? <Check className="h-4 w-4" /> : null}
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
