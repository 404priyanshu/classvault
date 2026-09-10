import { SignUpExperience } from '@/components/journey/SignUpExperience'
import { getTurnstileSiteKey } from '@/lib/auth/captcha'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return <SignUpExperience error={error} siteKey={getTurnstileSiteKey()} />
}
