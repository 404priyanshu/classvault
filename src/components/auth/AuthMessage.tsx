import { ClearAuthMessageParams } from './ClearAuthMessageParams'

type AuthMessageProps = {
  error?: string
  status?: string
}

export function AuthMessage({ error, status }: AuthMessageProps) {
  if (!error && !status) {
    return null
  }

  return (
    <>
      <ClearAuthMessageParams />
      <p
        className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          error
            ? 'border-red-900/40 bg-red-50 text-red-900'
            : 'border-club-purple/40 bg-club-purple/10 text-club-purple'
        }`}
        role={error ? 'alert' : 'status'}
      >
        {error || status}
      </p>
    </>
  )
}
