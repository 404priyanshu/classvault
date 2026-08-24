import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import {
  BookOpen,
  Fingerprint,
  GraduationCap,
  KeyRound,
  Mail,
  Settings2,
  Smartphone,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { AvatarSettingsForm } from '@/components/settings/AvatarSettingsForm'
import { CopyAccountId } from '@/components/settings/CopyAccountId'
import { PasswordSettingsForm } from '@/components/settings/PasswordSettingsForm'
import { ProfileDetailsForm } from '@/components/settings/ProfileDetailsForm'
import { StudyPreferencesForm } from '@/components/settings/StudyPreferencesForm'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const settingsLinks = [
  { href: '#profile', icon: UserRound, label: 'Profile' },
  { href: '#account', icon: Fingerprint, label: 'Account' },
  { href: '#preferences', icon: Sparkles, label: 'Preferences' },
  { href: '#security', icon: KeyRound, label: 'Password & security' },
]

function SettingsSection({
  children,
  description,
  id,
  title,
}: {
  children: ReactNode
  description: string
  id: string
  title: string
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-28 overflow-hidden rounded-lg border border-[#d6cbb8] bg-[#fffdf6] shadow-[0_1px_0_rgba(23,21,18,0.04)]"
      id={id}
    >
      <div className="border-b border-[#e2dacb] px-5 py-5 sm:px-7">
        <h2 className="font-display text-2xl font-black" id={`${id}-heading`}>
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#171512]/55">
          {description}
        </p>
      </div>
      <div className="px-5 py-6 sm:px-7">{children}</div>
    </section>
  )
}

function AccountRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: ReactNode
}) {
  return (
    <div className="grid gap-3 border-b border-[#e8e1d5] py-4 last:border-b-0 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
      <div className="flex items-center gap-2 text-sm font-bold text-[#171512]/65">
        <Icon aria-hidden className="h-4 w-4 text-[#17453a]" strokeWidth={1.8} />
        {label}
      </div>
      <div className="min-w-0 text-sm font-semibold">{value}</div>
    </div>
  )
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims) redirect('/auth/sign-in?next=/dashboard/settings')

  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'avatar_url, course, created_at, display_name, graduation_year, primary_goal, study_preference, university_name',
      )
      .eq('id', claims.sub)
      .maybeSingle(),
    supabase
      .from('university_memberships')
      .select('academic_email, status')
      .eq('user_id', claims.sub)
      .maybeSingle(),
  ])

  if (profileResult.error || !profileResult.data) {
    throw new Error('Your settings could not be loaded.')
  }

  const profile = profileResult.data
  const membership = membershipResult.data
  const email = typeof claims.email === 'string' ? claims.email : null
  const phone = typeof claims.phone === 'string' ? claims.phone : null
  const displayName =
    profile.display_name || email?.split('@')[0] || phone || 'ClassVault student'
  const graduationYear =
    profile.graduation_year || new Date().getFullYear() + 3
  const createdDate = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(profile.created_at))

  return (
    <div className="mx-auto max-w-[1240px]">
      <header className="border-b border-[#cfc4ae] pb-7">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-[#17453a]">
          <Settings2 aria-hidden className="h-4 w-4" />
          Account controls
        </div>
        <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.025em] sm:text-5xl">
          Settings
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
          Manage how you appear in ClassVault, update your study profile, and
          keep your account secure.
        </p>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)] xl:gap-10">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav
            aria-label="Settings sections"
            className="grid grid-cols-2 gap-1 rounded-lg border border-[#d6cbb8] bg-[#fffdf6] p-2 lg:grid-cols-1"
          >
            {settingsLinks.map(({ href, icon: Icon, label }) => (
              <a
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-bold text-[#171512]/70 transition hover:bg-[#eef4ed] hover:text-[#17453a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17453a]"
                href={href}
                key={href}
              >
                <Icon aria-hidden className="h-4 w-4" strokeWidth={1.8} />
                {label}
              </a>
            ))}
          </nav>
          <p className="mt-4 hidden px-2 text-xs leading-relaxed text-[#171512]/45 lg:block">
            Changes save to your private ClassVault profile. Your login identity
            is never shown beside notes.
          </p>
        </aside>

        <div className="min-w-0 space-y-6">
          <SettingsSection
            description="Choose your photo and the name classmates see beside shared notes."
            id="profile"
            title="Profile"
          >
            <AvatarSettingsForm
              avatarUrl={profile.avatar_url}
              displayName={displayName}
            />
            <div className="my-7 border-t border-[#e2dacb]" />
            <ProfileDetailsForm
              course={profile.course || 'M.Tech'}
              displayName={displayName}
              graduationYear={graduationYear}
            />
          </SettingsSection>

          <SettingsSection
            description="Review your sign-in identity, permanent ClassVault ID, and university access."
            id="account"
            title="Account"
          >
            <div className="-my-2">
              <AccountRow
                icon={Fingerprint}
                label="ClassVault ID"
                value={
                  <div className="flex flex-wrap items-center gap-3">
                    <code className="max-w-full truncate rounded bg-[#f2ecdf] px-2 py-1 font-mono text-xs">
                      {claims.sub}
                    </code>
                    <CopyAccountId accountId={String(claims.sub)} />
                  </div>
                }
              />
              {email ? (
                <AccountRow
                  icon={Mail}
                  label="Email address"
                  value={
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="break-all">{email}</span>
                      <span className="rounded bg-[#e3efe5] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#246447]">
                        Confirmed
                      </span>
                    </span>
                  }
                />
              ) : null}
              {phone ? (
                <AccountRow icon={Smartphone} label="Phone number" value={phone} />
              ) : null}
              <AccountRow
                icon={GraduationCap}
                label="University"
                value={
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{profile.university_name || 'Not selected'}</span>
                    <span className="rounded bg-[#fff1c7] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#805500]">
                      {membership?.status || 'pending'}
                    </span>
                  </span>
                }
              />
              {membership?.academic_email ? (
                <AccountRow
                  icon={BookOpen}
                  label="Academic email"
                  value={membership.academic_email}
                />
              ) : null}
              <AccountRow
                icon={UserRound}
                label="Member since"
                value={createdDate}
              />
            </div>
            <p className="mt-5 rounded-md bg-[#f5efe3] px-4 py-3 text-xs leading-relaxed text-[#171512]/60">
              Your ClassVault ID is permanent and cannot be changed. Edit your
              display name above to change the identity other students see.
            </p>
          </SettingsSection>

          <SettingsSection
            description="Adjust the goals and study style ClassVault uses when shaping your experience."
            id="preferences"
            title="Study preferences"
          >
            <StudyPreferencesForm
              primaryGoal={profile.primary_goal || 'stay_consistent'}
              studyPreference={profile.study_preference || 'accountability'}
            />
          </SettingsSection>

          <SettingsSection
            description="Use a strong, unique password with at least eight characters."
            id="security"
            title="Password & security"
          >
            <PasswordSettingsForm />
          </SettingsSection>
        </div>
      </div>
    </div>
  )
}
