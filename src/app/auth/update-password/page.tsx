import { redirect } from 'next/navigation'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { AuthShell } from '@/components/auth/AuthShell'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { createClient } from '@/lib/supabase/server'
import { updatePasswordAction } from '../actions'

type UpdatePasswordPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function UpdatePasswordPage({
  searchParams,
}: UpdatePasswordPageProps) {
  const { error } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    redirect('/auth/sign-in')
  }

  return (
    <AuthShell
      description="Choose a fresh password for your ClassVault account."
      eyebrow="Secure your account"
      title="Set a new password."
    >
      <AuthMessage error={error} />
      <form action={updatePasswordAction} className="space-y-5">
        <label className="block">
          <span className="text-sm font-bold">New password</span>
          <input
            autoComplete="new-password"
            className="app-field mt-2 px-4"
            maxLength={72}
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold">Confirm new password</span>
          <input
            autoComplete="new-password"
            className="app-field mt-2 px-4"
            maxLength={72}
            minLength={8}
            name="passwordConfirmation"
            required
            type="password"
          />
        </label>
        <SubmitButton idleLabel="Update password" pendingLabel="Saving…" />
      </form>
    </AuthShell>
  )
}
