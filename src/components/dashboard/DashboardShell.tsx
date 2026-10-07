'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { BarChart3, BookOpen, FileText, GraduationCap, LayoutDashboard, Menu, Route, ShieldAlert, Upload, UsersRound, X, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { ProfileAvatar } from '@/components/settings/ProfileAvatar'
import { Brand } from '@/components/ui/Brand'
import { cn } from '@/lib/utils'

type DashboardShellProps = {
  avatarUrl: string | null
  children: ReactNode
  course: string | null
  displayName: string
  membershipStatus: string
  signOutControl: ReactNode
  universityName: string | null
  isAdmin?: boolean
  isModerator?: boolean
}

type NavItem = { href: string; icon: LucideIcon; label: string; shortLabel?: string }

// The four places a student studies. They head the sidebar and, below the
// desktop breakpoint, make up the bottom tab bar.
const studyNavigation: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Your clubhouse', shortLabel: 'Home' },
  { href: '/dashboard/notes', icon: FileText, label: 'Notes library', shortLabel: 'Library' },
  { href: '/dashboard/roadmaps', icon: Route, label: 'Study roadmaps', shortLabel: 'Roadmaps' },
  { href: '/dashboard/study-rooms', icon: UsersRound, label: 'Study rooms', shortLabel: 'Rooms' },
]

function getPageTitle(path: string, isTrash: boolean) {
  if (path === '/dashboard/vault') return isTrash ? 'Trash' : 'My Vault'
  if (path === '/dashboard/notes/new') return 'Upload notes'
  if (path === '/dashboard/notes/batch') return 'Batch upload'
  if (path.startsWith('/dashboard/verification')) return 'Campus verification'
  if (path.startsWith('/dashboard/moderation')) return 'Moderation'
  if (path.startsWith('/dashboard/usage')) return 'Usage'
  if (path.startsWith('/dashboard/settings')) return 'Settings'
  return [...studyNavigation].reverse().find(item => path.startsWith(item.href))?.label || 'Your clubhouse'
}

function isActive(href: string, pathname: string) {
  if (href === '/dashboard') return pathname === href
  // Uploading has its own page title and the sidebar's upload button; it is
  // not browsing the library.
  if (href === '/dashboard/notes') return pathname.startsWith(href) && !pathname.endsWith('/new') && !pathname.endsWith('/batch')
  return pathname.startsWith(href)
}

export function DashboardShell({ avatarUrl, children, course, displayName, membershipStatus, signOutControl, universityName, isAdmin = false, isModerator = false }: DashboardShellProps) {
  const pathname = usePathname()
  const params = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isTrash = params.get('view') === 'trash'
  // Trash is a tab inside My Vault, and verification drops out once it is done
  // (the page still answers at its address). Settings lives behind the profile
  // at the foot of the sidebar.
  const groups: { label: string; items: NavItem[] }[] = [
    { label: 'Study', items: studyNavigation },
    {
      label: 'Yours',
      items: [
        { href: '/dashboard/vault', icon: BookOpen, label: 'My Vault' },
        ...(membershipStatus === 'verified' ? [] : [{ href: '/dashboard/verification', icon: GraduationCap, label: 'Campus verification' }]),
      ],
    },
    {
      label: 'Team',
      items: [
        ...(isModerator ? [{ href: '/dashboard/moderation', icon: ShieldAlert, label: 'Moderation' }] : []),
        ...(isAdmin ? [{ href: '/dashboard/usage', icon: BarChart3, label: 'Usage' }] : []),
      ],
    },
  ]

  useEffect(() => {
    if (menuOpen) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [menuOpen])

  const sidebar = (
    <div className="club-sidebar-inner">
      <div className="flex items-center justify-between gap-3">
        <Brand href="/dashboard" light />
        <button className="club-drawer-close lg:hidden" aria-label="Close navigation" type="button" onClick={() => setMenuOpen(false)}><X size={20} /></button>
      </div>
      <div className="club-campus-label"><span aria-hidden>✳</span><div><strong>{universityName || 'Your campus corner'}</strong><small>{course || 'One good study day at a time'}</small></div></div>
      <nav aria-label="Dashboard navigation" className="club-sidebar-nav">
        {groups.filter(group => group.items.length > 0).map(group => (
          <div key={group.label} role="group" aria-labelledby={`nav-group-${group.label}`} className="club-nav-group">
            <span id={`nav-group-${group.label}`} className="club-nav-group-label">{group.label}</span>
            {group.items.map(({ href, icon: Icon, label }) => {
              const active = isActive(href, pathname)
              return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cn('club-nav-item', active && 'club-nav-active')} data-cuelume-hover="tick" onClick={() => setMenuOpen(false)}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></Link>
            })}
          </div>
        ))}
      </nav>
      <Link href="/dashboard/notes/new" className="club-sidebar-upload" data-cuelume-press data-cuelume-release onClick={() => setMenuOpen(false)}><Upload size={18} /> Share your notes <ArrowUpRight size={16} /></Link>
      <p className="club-sidebar-nudge">Every note you share helps someone revise.</p>
      <div className="club-sidebar-profile">
        <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="flex min-w-0 items-center gap-3">
          <ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} className="h-10 w-10 rounded-xl text-sm" />
          <span className="min-w-0"><strong className="block truncate text-sm">{displayName}</strong><small className="mt-1 block text-[11px] text-club-paper/80">Profile and settings</small></span>
        </Link>
        <div className="club-sidebar-signout">{signOutControl}</div>
      </div>
    </div>
  )

  return (
    <div className="club-workspace min-h-dvh bg-club-bg text-club-ink">
      <a className="club-skip-link" href="#dashboard-main">Skip to content</a>
      <aside className="club-sidebar fixed inset-y-0 left-0 z-40 hidden w-[256px] lg:block">{sidebar}</aside>
      <dialog aria-label="Dashboard navigation" ref={dialogRef} id="dashboard-navigation-drawer" className="club-drawer" onCancel={() => setMenuOpen(false)} onClick={event => { if (event.target === event.currentTarget) setMenuOpen(false) }}>
        <aside className="club-sidebar h-full">{sidebar}</aside>
      </dialog>
      <div className="min-h-dvh lg:pl-[256px]">
        <header className="club-workspace-header">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="dashboard-navigation-drawer" className="club-menu-button lg:hidden" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
            <div><span className="hidden text-[10px] font-bold uppercase tracking-wider text-club-muted sm:block">Your study space</span><p className="truncate text-base font-extrabold tracking-tight">{getPageTitle(pathname, isTrash)}</p></div>
          </div>
          <div className="flex items-center gap-3">
            {membershipStatus === 'verified'
              ? <span className="hidden rounded-full bg-club-lavender px-3 py-2 text-[11px] font-semibold text-club-deep sm:block">✓ Campus verified</span>
              : <Link href="/dashboard/verification" className="hidden rounded-full bg-club-yellow px-3 py-2 text-[11px] font-semibold text-club-deep transition hover:bg-club-yellow/70 sm:block">{membershipStatus === 'rejected' ? 'Campus access unverified' : 'Verify your campus'} →</Link>}
            <Link href="/dashboard/settings" aria-label="Edit profile settings"><ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} className="h-10 w-10 rounded-full text-sm" /></Link>
          </div>
        </header>
        <main id="dashboard-main" className="club-workspace-main mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 xl:px-10">{children}</main>
      </div>
      <nav aria-label="Main sections" className="club-tabbar lg:hidden">
        {studyNavigation.map(({ href, icon: Icon, shortLabel, label }) => {
          const active = isActive(href, pathname)
          return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cn('club-tab', active && 'club-tab-active')}><Icon size={20} strokeWidth={active ? 2.2 : 1.8} /><span>{shortLabel || label}</span></Link>
        })}
      </nav>
    </div>
  )
}
