'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  Bell,
  BookMarked,
  BookOpen,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  Route,
  Settings,
  Share2,
  Trash2,
  Upload,
  UsersRound,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type DashboardShellProps = {
  children: ReactNode
  course: string | null
  displayName: string
  membershipStatus: string
  signOutControl: ReactNode
  universityName: string | null
}

type NavigationItem = {
  disabled?: boolean
  href?: string
  icon: typeof LayoutDashboard
  label: string
}

const primaryNavigation: NavigationItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard#notes', icon: FileText, label: 'Notes' },
  { href: '/dashboard#roadmap-preview', icon: Route, label: 'Roadmaps' },
  { href: '/dashboard#room-preview', icon: UsersRound, label: 'Study rooms' },
  { href: '/dashboard/notes/new', icon: Upload, label: 'Upload notes' },
]

const secondaryNavigation: NavigationItem[] = [
  { disabled: true, icon: BookMarked, label: 'Bookmarks' },
  { disabled: true, icon: BookOpen, label: 'My uploads' },
  { disabled: true, icon: Share2, label: 'Shared with me' },
  { disabled: true, icon: Trash2, label: 'Trash' },
]

function getPageTitle(pathname: string) {
  if (pathname === '/dashboard/notes/new') return 'Upload notes'
  if (pathname.startsWith('/dashboard/notes')) return 'Notes'
  if (pathname.startsWith('/dashboard/roadmaps')) return 'Roadmaps'
  if (pathname.startsWith('/dashboard/study-rooms')) return 'Study rooms'
  return 'Dashboard'
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function SidebarNavigation({
  closeMenu,
  pathname,
}: {
  closeMenu: () => void
  pathname: string
}) {
  const renderItem = (item: NavigationItem) => {
    const Icon = item.icon
    const baseHref = item.href?.split('#')[0]
    const isActive =
      item.href === '/dashboard'
        ? pathname === '/dashboard'
        : Boolean(
            baseHref &&
              baseHref !== '/dashboard' &&
              pathname.startsWith(baseHref),
          )

    if (item.disabled) {
      return (
        <div
          aria-disabled="true"
          className="flex min-h-11 items-center gap-3 px-3 text-sm font-semibold text-[#f6f1e5]/50"
          key={item.label}
          title={`${item.label} is coming in a later frontend slice`}
        >
          <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span>{item.label}</span>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.12em]">
            Soon
          </span>
        </div>
      )
    }

    return (
      <Link
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-bold transition-colors',
          isActive
            ? 'bg-[#fffdf6] text-[#171512] shadow-[2px_2px_0_rgba(23,21,18,0.45)]'
            : 'text-[#f6f1e5]/90 hover:bg-[#f6f1e5]/10 hover:text-[#fffdf6]',
        )}
        href={item.href || '/dashboard'}
        key={item.label}
        onClick={closeMenu}
      >
        <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.8} />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <nav aria-label="Dashboard navigation" className="flex flex-1 flex-col">
      <div className="space-y-1">{primaryNavigation.map(renderItem)}</div>
      <div className="my-4 border-t border-[#f6f1e5]/25" />
      <div className="space-y-0.5">{secondaryNavigation.map(renderItem)}</div>
    </nav>
  )
}

export function DashboardShell({
  children,
  course,
  displayName,
  membershipStatus,
  signOutControl,
  universityName,
}: DashboardShellProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const pageTitle = getPageTitle(pathname)
  const profileMeta = [course, universityName].filter(Boolean).join(' · ')

  const sidebar = (
    <div className="flex h-full flex-col px-5 pb-5 pt-6">
      <div className="mb-8 flex items-center justify-between gap-3 px-1">
        <Link
          className="flex items-center gap-3 text-[#fffdf6]"
          href="/dashboard"
          onClick={() => setMenuOpen(false)}
        >
          <span className="grid h-10 w-10 place-items-center rounded-sm border border-[#f6f1e5]/60 bg-[#f6f1e5]/10 shadow-[3px_3px_0_rgba(8,29,24,0.9)]">
            <BookOpen className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span>
            <span className="font-display block text-[1.4rem] font-black leading-none">
              ClassVault
            </span>
            <span className="mt-1 block text-[10px] font-semibold tracking-[0.08em] text-[#f6f1e5]/60">
              NOTES · TRUST · PROGRESS
            </span>
          </span>
        </Link>
        <button
          aria-label="Close navigation"
          className="grid h-9 w-9 place-items-center text-[#f6f1e5] lg:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <SidebarNavigation
        closeMenu={() => setMenuOpen(false)}
        pathname={pathname}
      />

      <div className="mt-5 border-t border-[#f6f1e5]/25 pt-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#171512] bg-[#f0a202] font-display text-sm font-black text-[#171512] shadow-[2px_2px_0_#171512]">
            {initialsFor(displayName) || 'CV'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-[#fffdf6]">
              {displayName}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-[#f6f1e5]/60">
              {profileMeta || 'ClassVault student'}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-[#f6f1e5]/70" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="paper-grain relative min-h-screen bg-[#f6f1e5] text-[#171512]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] bg-[#17453a] shadow-[4px_0_0_rgba(23,21,18,0.08)] lg:block">
        {sidebar}
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-[#171512]/50 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(88vw,320px)] bg-[#17453a] shadow-[8px_0_0_rgba(23,21,18,0.18)]">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="relative min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-[#cfc4ae] bg-[#fffdf6]/95 px-4 backdrop-blur-md sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-expanded={menuOpen}
              aria-label="Open navigation"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-[#171512]/30 bg-[#fffdf6] lg:hidden"
              onClick={() => setMenuOpen(true)}
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>
            <PanelLeftClose
              aria-hidden
              className="hidden h-5 w-5 text-[#171512]/60 lg:block"
              strokeWidth={1.7}
            />
            <p className="font-display truncate text-lg font-bold sm:text-xl">
              {pageTitle}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 border-r border-[#171512]/20 pr-4 text-xs font-bold sm:flex">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  membershipStatus === 'verified'
                    ? 'bg-[#2d7c58]'
                    : 'bg-[#f0a202]',
                )}
              />
              Campus access: {membershipStatus}
            </div>
            <button
              aria-label="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-sm text-[#171512]/70 transition-colors hover:bg-[#f0a202]/15 hover:text-[#171512]"
              type="button"
            >
              <Bell className="h-[19px] w-[19px]" strokeWidth={1.8} />
            </button>
            <Link
              aria-label="Edit profile settings"
              className="grid h-10 w-10 place-items-center rounded-sm text-[#171512]/70 transition-colors hover:bg-[#f0a202]/15 hover:text-[#171512]"
              href="/onboarding?edit=1"
            >
              <Settings className="h-[19px] w-[19px]" strokeWidth={1.8} />
            </Link>
            <div className="hidden md:block">{signOutControl}</div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-[1520px] px-4 py-6 sm:px-7 sm:py-8 lg:px-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
