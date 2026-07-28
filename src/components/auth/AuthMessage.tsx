type AuthMessageProps = {
  error?: string
  status?: string
}

export function AuthMessage({ error, status }: AuthMessageProps) {
  if (!error && !status) {
    return null
  }

  return (
    <p
      className={`mb-5 border-[1.5px] px-4 py-3 text-sm font-semibold ${
        error
          ? 'border-red-900/40 bg-red-50 text-red-900'
          : 'border-[#17453a]/40 bg-[#17453a]/10 text-[#17453a]'
      }`}
      role={error ? 'alert' : 'status'}
    >
      {error || status}
    </p>
  )
}
