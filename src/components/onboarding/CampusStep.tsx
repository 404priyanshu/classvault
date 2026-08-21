import { Building2, Check, Mail, Search, Smartphone } from 'lucide-react'
import type { University } from './types'

export function CampusStep({
  accountEmail,
  accountIdentifier,
  activeUniversity,
  filteredUniversities,
  onQueryChange,
  onQueryFocus,
  onSelectUniversity,
  showUniversityResults,
  universityId,
  universityQuery,
  willVerify,
}: {
  accountEmail: string | null
  accountIdentifier: string
  activeUniversity?: University
  filteredUniversities: University[]
  onQueryChange: (value: string) => void
  onQueryFocus: () => void
  onSelectUniversity: (university: University) => void
  showUniversityResults: boolean
  universityId: number | null
  universityQuery: string
  willVerify: boolean
}) {
  return (
    <div>
      <h2 className="font-display max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl">
        Which campus do you call home?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
        Choose your university to unlock the right notes and
        communities.
      </p>

      <div className="mt-7 border-[1.5px] border-[#17453a]/55 bg-[#17453a]/5 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#17453a] text-[#f6f1e5]">
            {accountEmail ? (
              <Mail className="h-4 w-4" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#171512]/50">
              Signed in with {accountEmail ? 'email' : 'phone'}
            </p>
            <p className="truncate font-black text-[#17453a]">
              {accountIdentifier}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#171512]/60">
              {!accountEmail ? (
                <>
                  You can continue with your verified phone
                  number. University-only access will remain
                  pending until a verified academic email is
                  added.
                </>
              ) : activeUniversity ? (
                willVerify ? (
                  <>
                    Your confirmed email matches{' '}
                    <strong>{activeUniversity.shortName || activeUniversity.name}</strong>.
                    Campus access will be verified automatically.
                  </>
                ) : (
                  <>
                    You can continue, but university-only access
                    will remain pending until this email domain is
                    verified for your campus.
                  </>
                )
              ) : (
                'Verification is checked automatically after you choose a campus.'
              )}
            </p>
          </div>
          {activeUniversity && willVerify ? (
            <Check className="ml-auto h-5 w-5 shrink-0 text-[#17453a]" />
          ) : null}
        </div>
      </div>

      <div className="relative mt-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#17453a]" />
          <span className="sr-only">
            Search for your university
          </span>
          <input
            aria-autocomplete="list"
            aria-controls="university-search-results"
            aria-expanded={showUniversityResults}
            className="h-[52px] w-full border-[1.5px] border-[#171512] bg-[#fffdf6] pl-12 pr-4 text-sm font-semibold outline-none transition-shadow placeholder:font-normal focus:shadow-[3px_3px_0_#f0a202]"
            onChange={(event) => {
              onQueryChange(event.target.value)
            }}
            onFocus={onQueryFocus}
            placeholder="Start typing your college name"
            role="combobox"
            type="search"
            value={universityQuery}
          />
        </label>

        {showUniversityResults ? (
          <div
            className="absolute inset-x-0 top-[calc(100%+8px)] z-20 max-h-[290px] overflow-y-auto border-[1.5px] border-[#171512] bg-[#fffdf6] shadow-[4px_4px_0_#171512]"
            id="university-search-results"
            role="listbox"
          >
            {filteredUniversities.length ? (
              filteredUniversities.map((university) => {
                const selected =
                  university.id === universityId

                return (
                  <button
                    aria-selected={selected}
                    className={`flex w-full items-center gap-3 border-b border-[#171512]/15 px-4 py-3 text-left last:border-b-0 ${
                      selected
                        ? 'bg-[#17453a] text-[#f6f1e5]'
                        : 'hover:bg-[#f0a202]/10'
                    }`}
                    key={university.id}
                    onClick={() => {
                      onSelectUniversity(university)
                    }}
                    role="option"
                    type="button"
                  >
                    <Building2 className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black">
                        {university.name}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs ${
                          selected
                            ? 'text-[#f6f1e5]/65'
                            : 'text-[#171512]/50'
                        }`}
                      >
                        {[university.city, university.state]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </span>
                    {selected ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : null}
                  </button>
                )
              })
            ) : (
              <p className="px-5 py-8 text-center text-sm text-[#171512]/55">
                No college matches that search yet.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {activeUniversity ? (
        <div className="mt-3 flex items-center gap-3 border-[1.5px] border-[#17453a] bg-[#17453a] px-4 py-3 text-[#f6f1e5]">
          <Building2 className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black">
              {activeUniversity.name}
            </span>
            <span className="mt-0.5 block text-xs text-[#f6f1e5]/65">
              {[activeUniversity.city, activeUniversity.state]
                .filter(Boolean)
                .join(', ')}
            </span>
          </span>
          <Check className="h-4 w-4 shrink-0" />
        </div>
      ) : (
        <p className="mt-3 text-xs text-[#171512]/50">
          Type at least two characters, then choose a college
          from the results.
        </p>
      )}
    </div>
  )
}
