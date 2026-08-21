'use client'

import { Globe2, GraduationCap, Info } from 'lucide-react'
import type { SubjectOption } from '@/components/notes/subject-option'
import { cn } from '@/lib/utils'

export function NoteMetadataFields({
  description,
  hasVerifiedUniversity,
  onDescriptionChange,
  onTagsChange,
  subjects,
  tagCount,
  tags,
  universityName,
}: {
  description: string
  hasVerifiedUniversity: boolean
  onDescriptionChange: (value: string) => void
  onTagsChange: (value: string) => void
  subjects: SubjectOption[]
  tagCount: number
  tags: string
  universityName: string | null
}) {
  return (
    <div className="bg-ruled p-5 sm:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-black">
          Title
          <input
            className="min-h-11 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]"
            maxLength={180}
            name="title"
            placeholder="Enter a clear and specific title"
            required
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-black">
            Subject
            <select
              className="min-h-11 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]"
              defaultValue=""
              name="subjectId"
              required
            >
              <option disabled value="">
                Select your subject
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code ? `${subject.code} · ` : ''}
                  {subject.name}
                  {subject.university_id ? ' · campus' : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-black">
            Note type
            <select
              className="min-h-11 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]"
              defaultValue=""
              name="noteType"
              required
            >
              <option disabled value="">
                Select note type
              </option>
              <option value="lecture_notes">Lecture notes</option>
              <option value="summary">Summary</option>
              <option value="pyq">Previous-year paper</option>
              <option value="solution">Solution</option>
              <option value="lab">Lab material</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-black">Who can access it?</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer gap-3 rounded-sm border-[1.5px] border-[#171512] bg-[#17453a]/5 p-4 has-[:checked]:border-[#17453a] has-[:checked]:shadow-[3px_3px_0_#17453a]">
              <input
                className="mt-1 accent-[#17453a]"
                defaultChecked
                name="visibility"
                type="radio"
                value="public"
              />
              <span>
                <span className="flex items-center gap-2 font-black">
                  <Globe2 className="h-4 w-4" /> Public
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-[#171512]/60">
                  Any eligible ClassVault student can discover and access
                  this note.
                </span>
              </span>
            </label>

            <label
              className={cn(
                'flex gap-3 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] p-4 has-[:checked]:border-[#17453a] has-[:checked]:shadow-[3px_3px_0_#17453a]',
                hasVerifiedUniversity
                  ? 'cursor-pointer'
                  : 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                className="mt-1 accent-[#17453a]"
                disabled={!hasVerifiedUniversity}
                name="visibility"
                type="radio"
                value="university"
              />
              <span>
                <span className="flex items-center gap-2 font-black">
                  <GraduationCap className="h-4 w-4" /> University only
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-[#171512]/60">
                  {hasVerifiedUniversity
                    ? `Only verified students at ${universityName || 'your university'} can access it.`
                    : 'Verify your university membership to use this scope.'}
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-[#171512]/60">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Misleading, unsafe, or plagiarized content may be restricted or
          removed after review.
        </p>

        <label className="grid gap-2 text-sm font-black">
          <span className="flex items-center justify-between gap-3">
            Description <span>{description.length} / 2000</span>
          </span>
          <textarea
            className="min-h-24 resize-y rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202]"
            maxLength={2000}
            name="description"
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Add a short description about this note (optional)"
            value={description}
          />
        </label>

        <label className="grid gap-2 text-sm font-black">
          <span className="flex items-center justify-between gap-3">
            Tags <span>{tagCount} / 10</span>
          </span>
          <input
            aria-invalid={tagCount > 10}
            className="min-h-11 rounded-sm border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 text-base font-medium outline-none focus:ring-2 focus:ring-[#f0a202] aria-[invalid=true]:border-red-700"
            name="tags"
            onChange={(event) => onTagsChange(event.target.value)}
            placeholder="midsem, important, pyq"
            value={tags}
          />
          <span className="text-xs font-medium text-[#171512]/55">
            Separate up to 10 lowercase tags with commas.
          </span>
        </label>
      </div>
    </div>
  )
}
