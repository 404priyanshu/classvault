'use client'

import { useActionState, useState } from 'react'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { deleteAccountAction } from '@/app/dashboard/settings/actions'
import { initialSettingsActionState } from '@/lib/settings/action-state'
import { SettingsFormStatus } from './SettingsFormStatus'

const CONFIRMATION = 'DELETE'

function DeleteAccountButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#9a3328] px-4 text-sm font-bold text-club-paper transition duration-200 hover:bg-[#7d2920] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
      data-cuelume-press
      data-cuelume-release
      disabled={pending || !enabled}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        <TriangleAlert aria-hidden className="h-4 w-4" />
      )}
      {pending ? 'Closing your account…' : 'Close my account'}
    </button>
  )
}

/**
 * Closing an account, with the one decision that cannot be undone made
 * explicit.
 *
 * The uploads choice is asked here rather than assumed because both answers are
 * defensible: a student may want their work to stay useful to the people they
 * shared it with, or may want it gone with them. Published work is the only
 * thing the question covers -- drafts and anything already in Trash leave
 * either way, since nobody else can see them.
 */
export function DeleteAccountForm({ noteCount }: { noteCount: number }) {
  const [state, formAction] = useActionState(
    deleteAccountAction,
    initialSettingsActionState,
  )
  const [confirmation, setConfirmation] = useState('')

  return (
    <form action={formAction}>
      <p className="text-sm leading-relaxed text-club-muted">
        Closing your account removes your profile, your university membership,
        your ratings, your roadmaps and your room history. It cannot be undone,
        and the email becomes free to sign up with again.
      </p>

      {noteCount > 0 ? (
        <fieldset className="mt-5 rounded-xl border border-club-line p-4">
          <legend className="px-1.5 text-sm font-bold">
            Your {noteCount === 1 ? 'note' : `${noteCount} notes`}
          </legend>
          <label className="flex gap-3 text-sm leading-relaxed">
            <input
              className="mt-1 h-4 w-4 accent-club-purple"
              defaultChecked
              name="uploads"
              type="radio"
              value="keep"
            />
            <span>
              <span className="font-bold">Leave my published notes</span>
              <span className="block text-club-muted">
                They stay in the library for classmates still using them, with
                no name attached. Drafts and anything in Trash are deleted.
              </span>
            </span>
          </label>
          <label className="mt-3 flex gap-3 text-sm leading-relaxed">
            <input
              className="mt-1 h-4 w-4 accent-club-purple"
              name="uploads"
              type="radio"
              value="remove"
            />
            <span>
              <span className="font-bold">Delete everything I uploaded</span>
              <span className="block text-club-muted">
                Every note and file you added is removed from the library and
                from storage.
              </span>
            </span>
          </label>
        </fieldset>
      ) : (
        <input name="uploads" type="hidden" value="remove" />
      )}

      <label className="mt-5 block">
        <span className="text-sm font-bold">
          Type {CONFIRMATION} to confirm
        </span>
        <input
          autoComplete="off"
          className="mt-2 min-h-11 w-full max-w-xs rounded-xl border border-club-line bg-club-paper px-3.5 text-sm font-semibold outline-none transition focus:border-[#9a3328] focus:ring-2 focus:ring-[#9a3328]/15"
          name="confirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          required
          spellCheck={false}
          type="text"
          value={confirmation}
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-club-line pt-5">
        <SettingsFormStatus state={state} />
        <DeleteAccountButton enabled={confirmation.trim() === CONFIRMATION} />
      </div>
    </form>
  )
}
