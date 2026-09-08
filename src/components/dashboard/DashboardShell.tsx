'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { BookOpen, FileText, LayoutDashboard, Menu, Route, Settings, ShieldAlert, Trash2, Upload, UsersRound, X, ArrowUpRight } from 'lucide-react'
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
  isModerator?: boolean
}

const navigation = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Your clubhouse' },
  { href: '/dashboard/notes', icon: FileText, label: 'Notes library' },
  { href: '/dashboard/roadmaps', icon: Route, label: 'Study roadmaps' },
  { href: '/dashboard/study-rooms', icon: UsersRound, label: 'Study rooms' },
  { href: '/dashboard/vault', icon: BookOpen, label: 'My Vault' },
  { href: '/dashboard/vault?view=trash', icon: Trash2, label: 'Trash' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

function getPageTitle(path: string, isTrash: boolean) {
  if (path === '/dashboard/vault') return isTrash ? 'Trash' : 'My Vault'
  if (path === '/dashboard/notes/new') return 'Upload notes'
  if (path === '/dashboard/notes/batch') return 'Batch upload'
  if (path.startsWith('/dashboard/moderation')) return 'Moderation'
  return [...navigation].reverse().find(item => path.startsWith(item.href.split('?')[0]))?.label || 'Your clubhouse'
}

export function DashboardShell({ avatarUrl, children, course, displayName, membershipStatus, signOutControl, universityName, isModerator = false }: DashboardShellProps) {
  const pathname = usePathname()
  const params = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isTrash = params.get('view') === 'trash'
  const items = isModerator ? [...navigation, { href: '/dashboard/moderation', icon: ShieldAlert, label: 'Moderation' }] : navigation

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
        {items.map(({ href, icon: Icon, label }) => {
          const base = href.split('?')[0]
          const active = base === '/dashboard' ? pathname === base
            : base === '/dashboard/vault' ? pathname === base && (href.includes('?') === isTrash)
            : base === '/dashboard/notes' ? pathname.startsWith(base) && !pathname.endsWith('/new') && !pathname.endsWith('/batch')
            : pathname.startsWith(base)
          return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cn('club-nav-item', active && 'club-nav-active')} onClick={() => setMenuOpen(false)}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></Link>
        })}
      </nav>
      <Link href="/dashboard/notes/new" className="club-sidebar-upload" onClick={() => setMenuOpen(false)}><Upload size={18} /> Share your notes <ArrowUpRight size={16} /></Link>
      <p className="club-sidebar-nudge">A little knowledge goes a long way.</p>
      <div className="club-sidebar-profile">
        <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="flex min-w-0 items-center gap-3">
          <ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} className="h-10 w-10 rounded-xl text-sm" />
          <span className="min-w-0"><strong className="block truncate text-sm">{displayName}</strong><small className="mt-1 block text-[11px] text-club-paper/80">Make this place yours</small></span>
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
            <span className="hidden rounded-full bg-club-lavender px-3 py-2 text-[11px] font-semibold text-club-deep sm:block">{membershipStatus === 'verified' ? '✓ Campus verified' : 'Campus verification pending'}</span>
            <Link href="/dashboard/settings" aria-label="Edit profile settings"><ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} className="h-10 w-10 rounded-full text-sm" /></Link>
          </div>
        </header>
        <main id="dashboard-main" className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 xl:px-10">{children}</main>
      </div>
    </div>
  )
}
